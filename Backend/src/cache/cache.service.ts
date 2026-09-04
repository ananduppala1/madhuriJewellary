import type { Redis } from "ioredis";
import { logger } from "../config/logger.js";
import { ensureRedis, isRedisReady } from "../config/redis.js";
import {
  CACHE_DTO_VERSION,
  CACHE_LOCK_POLL_MS,
  CACHE_LOCK_PREFIX,
  CACHE_LOCK_TTL_MS,
  CACHE_LOCK_WAIT_MS,
  CACHE_TTL_DEFAULT,
  CACHE_VERSION_HASH,
  type CacheFamily,
} from "./cache.constants.js";
import { cacheMetrics } from "./cache.metrics.js";
import type { CacheDescriptor, CacheEnvelope } from "./cache.types.js";

/**
 * The only module that speaks Redis.
 *
 * Contract, in one line: a cache failure costs speed and nothing else. Every
 * command is wrapped, every failure falls through to the loader, and the value
 * a caller receives is identical whether it came from Redis or from Supabase.
 */

/* ── low-level helpers ─────────────────────────────────────── */

function ready(): Redis | null {
  // `ensureRedis` opens the connection on first use. On a long-lived server it
  // was already opened at boot and this is a null check; on a serverless host
  // it is what makes the cache exist at all.
  const client = ensureRedis();
  return client && isRedisReady() ? client : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reason(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  return (error as NodeJS.ErrnoException).code ?? error.name;
}

/* ── family versions ───────────────────────────────────────── */

/**
 * Each family owns a counter in one hash. A key embeds the counters of the
 * families it depends on, so `HINCRBY` retires every entry in a family at once
 * — O(1), non-blocking, and correct across any number of API instances.
 *
 * Counters are seeded from the clock rather than from zero. If the hash is ever
 * lost (eviction, a flush, a fresh Redis) the new seed is larger than anything
 * used before, so a surviving entry written under an old counter can never be
 * reachable again.
 */
function versionSeed(): number {
  return Math.floor(Date.now() / 1000);
}

async function readVersions(
  client: Redis,
  families: readonly CacheFamily[],
): Promise<Map<CacheFamily, string>> {
  const fields = [...families].sort();
  const values = await client.hmget(CACHE_VERSION_HASH, ...fields);

  const missing: string[] = [];
  const resolved = new Map<CacheFamily, string>();

  fields.forEach((field, index) => {
    const value = values[index];
    if (value === null || value === undefined) missing.push(field);
    else resolved.set(field as CacheFamily, value);
  });

  if (missing.length === 0) return resolved;

  // First request after a deploy against an empty Redis. Seed, then re-read so
  // every instance agrees on whichever seed won the race.
  const seed = String(versionSeed());
  const pipeline = client.pipeline();
  for (const field of missing) pipeline.hsetnx(CACHE_VERSION_HASH, field, seed);
  await pipeline.exec();

  const settled = await client.hmget(CACHE_VERSION_HASH, ...missing);
  missing.forEach((field, index) => {
    resolved.set(field as CacheFamily, settled[index] ?? seed);
  });

  return resolved;
}

/** The key actually stored in Redis: base key plus the family version tokens. */
function versionedKey(descriptor: CacheDescriptor, versions: Map<CacheFamily, string>): string {
  const tokens = [...descriptor.families]
    .sort()
    .map((family) => `${family}=${versions.get(family) ?? "0"}`)
    .join(",");

  return `${descriptor.key}#${tokens}`;
}

/* ── serialisation ─────────────────────────────────────────── */

function serialise<T>(value: T): string {
  const envelope: CacheEnvelope<T> = {
    v: CACHE_DTO_VERSION,
    t: Math.floor(Date.now() / 1000),
    d: value,
  };
  return JSON.stringify(envelope);
}

/**
 * Anything unexpected in Redis — truncated JSON, a payload written by an older
 * deploy — is treated as a miss. Malformed cache data must never reach a
 * client or throw inside a request.
 */
function deserialise<T>(raw: string): T | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (!parsed || typeof parsed !== "object") return undefined;
    if (parsed.v !== CACHE_DTO_VERSION) return undefined;
    if (parsed.d === undefined) return undefined;
    return parsed.d;
  } catch {
    cacheMetrics.deserialisationFailure();
    return undefined;
  }
}

/* ── public API ────────────────────────────────────────────── */

/** Read one entry. Returns undefined on a miss, an error, or a bad payload. */
export async function get<T>(descriptor: CacheDescriptor): Promise<T | undefined> {
  const client = ready();
  if (!client) return undefined;

  try {
    const versions = await readVersions(client, descriptor.families);
    const raw = await client.get(versionedKey(descriptor, versions));
    return raw === null ? undefined : deserialise<T>(raw);
  } catch (error) {
    logger.debug("cache read failed", { reason: reason(error) });
    return undefined;
  }
}

/**
 * Write one entry. A failure here is deliberately swallowed: the caller already
 * holds a good result from the database and the request must still succeed.
 */
export async function set<T>(descriptor: CacheDescriptor, value: T): Promise<boolean> {
  const client = ready();
  if (!client) return false;

  try {
    const versions = await readVersions(client, descriptor.families);
    await client.set(
      versionedKey(descriptor, versions),
      serialise(value),
      "EX",
      descriptor.ttl > 0 ? descriptor.ttl : CACHE_TTL_DEFAULT,
    );
    return true;
  } catch (error) {
    cacheMetrics.setFailure();
    logger.debug("cache write failed", { reason: reason(error) });
    return false;
  }
}

/** Remove one entry outright. Rarely needed — prefer family invalidation. */
export async function del(descriptor: CacheDescriptor): Promise<boolean> {
  const client = ready();
  if (!client) return false;

  try {
    const versions = await readVersions(client, descriptor.families);
    await client.del(versionedKey(descriptor, versions));
    return true;
  } catch (error) {
    cacheMetrics.invalidationFailure();
    logger.debug("cache delete failed", { reason: reason(error) });
    return false;
  }
}

export async function deleteMany(descriptors: CacheDescriptor[]): Promise<boolean> {
  const client = ready();
  if (!client || descriptors.length === 0) return false;

  try {
    const families = new Set<CacheFamily>();
    for (const descriptor of descriptors) {
      for (const family of descriptor.families) families.add(family);
    }

    const versions = await readVersions(client, [...families]);
    const pipeline = client.pipeline();
    for (const descriptor of descriptors) {
      pipeline.del(versionedKey(descriptor, versions));
    }
    await pipeline.exec();
    return true;
  } catch (error) {
    cacheMetrics.invalidationFailure();
    logger.debug("cache bulk delete failed", { reason: reason(error) });
    return false;
  }
}

/**
 * Retire whole families in one batched round trip. This is what admin
 * mutations call, and it is the reason no code path ever needs `KEYS`.
 */
export async function invalidateFamilies(families: readonly CacheFamily[]): Promise<boolean> {
  if (families.length === 0) return true;

  const client = ready();
  if (!client) {
    // Nothing is cached while Redis is down, so there is nothing stale to
    // retire — but if it returns before the entries expire they would still be
    // live, so this is recorded rather than ignored.
    cacheMetrics.invalidationFailure();
    return false;
  }

  const unique = [...new Set(families)];

  try {
    const pipeline = client.pipeline();
    for (const family of unique) pipeline.hincrby(CACHE_VERSION_HASH, family, 1);
    const results = await pipeline.exec();

    const failed = (results ?? []).some(([error]) => error);
    if (failed) throw new Error("pipeline");

    logger.info("cache invalidated", { families: unique.join(",") });
    return true;
  } catch (error) {
    cacheMetrics.invalidationFailure();
    logger.warn("cache invalidation failed", {
      families: unique.join(","),
      reason: reason(error),
    });
    return false;
  }
}

/* ── cache-aside with single-flight ────────────────────────── */

/**
 * Coalesces concurrent misses inside this process. Across processes the Redis
 * lock below does the same job. Together they mean one popular product
 * expiring under load produces one Supabase query, not five hundred.
 */
const inFlight = new Map<string, Promise<unknown>>();

async function acquireLock(client: Redis, key: string, token: string): Promise<boolean> {
  try {
    const result = await client.set(
      `${CACHE_LOCK_PREFIX}:${key}`,
      token,
      "PX",
      CACHE_LOCK_TTL_MS,
      "NX",
    );
    return result === "OK";
  } catch {
    // Could not take the lock; load anyway rather than stall the request.
    return false;
  }
}

async function releaseLock(client: Redis, key: string): Promise<void> {
  try {
    await client.del(`${CACHE_LOCK_PREFIX}:${key}`);
  } catch {
    // The lock expires on its own; nothing to recover.
  }
}

/** Poll briefly for the value another instance is loading right now. */
async function waitForPeer<T>(client: Redis, storedKey: string): Promise<T | undefined> {
  const deadline = Date.now() + CACHE_LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(CACHE_LOCK_POLL_MS);
    try {
      const raw = await client.get(storedKey);
      if (raw !== null) {
        const value = deserialise<T>(raw);
        if (value !== undefined) return value;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * The cache-aside entry point used by the service layer.
 *
 *   hit  → deserialise and return
 *   miss → load from Supabase, store, return
 *   Redis unavailable → load from Supabase and return
 *
 * `loader` is the existing service code, so the value cached is always the
 * finished public DTO and never a database row.
 */
export async function getOrSet<T>(
  descriptor: CacheDescriptor,
  loader: () => Promise<T>,
  label?: string,
): Promise<T> {
  const client = ready();

  if (!client) {
    cacheMetrics.bypass();
    return loader();
  }

  let storedKey: string;
  try {
    const versions = await readVersions(client, descriptor.families);
    storedKey = versionedKey(descriptor, versions);
  } catch {
    cacheMetrics.bypass();
    return loader();
  }

  try {
    const raw = await client.get(storedKey);
    if (raw !== null) {
      const cached = deserialise<T>(raw);
      if (cached !== undefined) {
        cacheMetrics.hit();
        if (label) logger.debug("cache hit", { entry: label });
        return cached;
      }
    }
  } catch (error) {
    logger.debug("cache read failed", { reason: reason(error) });
    cacheMetrics.bypass();
    return loader();
  }

  cacheMetrics.miss();
  if (label) logger.debug("cache miss", { entry: label });

  const pending = inFlight.get(storedKey);
  if (pending) {
    cacheMetrics.coalescedWait();
    return pending as Promise<T>;
  }

  const work = (async (): Promise<T> => {
    const token = `${process.pid}-${Date.now()}`;
    const locked = await acquireLock(client, storedKey, token);

    if (!locked) {
      const peerValue = await waitForPeer<T>(client, storedKey);
      if (peerValue !== undefined) {
        cacheMetrics.coalescedWait();
        return peerValue;
      }
    }

    try {
      const value = await loader();

      try {
        await client.set(
          storedKey,
          serialise(value),
          "EX",
          descriptor.ttl > 0 ? descriptor.ttl : CACHE_TTL_DEFAULT,
        );
      } catch (error) {
        // The database answered. A failed write costs the next visitor a miss.
        cacheMetrics.setFailure();
        logger.debug("cache write failed", { reason: reason(error) });
      }

      return value;
    } finally {
      if (locked) await releaseLock(client, storedKey);
    }
  })();

  inFlight.set(storedKey, work);

  try {
    return await work;
  } finally {
    inFlight.delete(storedKey);
  }
}

export const cache = {
  get,
  set,
  del,
  deleteMany,
  getOrSet,
  invalidateFamilies,
  metrics: cacheMetrics,
};
