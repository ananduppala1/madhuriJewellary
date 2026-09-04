// Named import rather than the default one: ioredis ships CommonJS types, and
// under the build config's NodeNext resolution a default import resolves to the
// module namespace instead of the class. `Redis` is exported by name and works
// identically under both the typecheck and the build configurations.
import { Redis, type RedisOptions } from "ioredis";
import { cacheEnabled, env, isServerless } from "./env.js";
import { logger } from "./logger.js";

/**
 * One Redis connection for the whole process.
 *
 * Three things matter more here than raw speed:
 *
 *  1. Redis is an accelerator, never a dependency. `enableOfflineQueue: false`
 *     means a command issued while the socket is down fails immediately instead
 *     of queueing until it times out — the caller then reads Supabase and the
 *     visitor never notices.
 *  2. Reconnection backs off. A tight retry loop against an unreachable managed
 *     Redis would burn CPU on every instance at once.
 *  3. Nothing about the connection string is ever logged. `REDIS_URL` carries
 *     the password, so only host-free status transitions reach the log.
 */

export type RedisHealth = "disabled" | "connecting" | "ok" | "degraded";

let client: Redis | null = null;
let health: RedisHealth = cacheEnabled ? "connecting" : "disabled";
let closing = false;
/** Throttles the "still down" line so an outage cannot flood the log drain. */
let lastErrorLoggedAt = 0;

const ERROR_LOG_INTERVAL_MS = 30_000;

function buildOptions(url: string): RedisOptions {
  const useTls = url.startsWith("rediss://");

  return {
    connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
    commandTimeout: env.REDIS_COMMAND_TIMEOUT_MS,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST,
    // A failed command must surface as an error the cache layer can swallow,
    // not sit in a queue while the request waits.
    enableOfflineQueue: false,
    enableReadyCheck: true,
    lazyConnect: true,
    keyPrefix: "",
    /** Exponential-ish backoff, capped, with jitter so instances do not sync up. */
    retryStrategy(times: number): number {
      const base = Math.min(times * 200, env.REDIS_MAX_RECONNECT_DELAY_MS);
      return base + Math.floor(Math.random() * 200);
    },
    /** Reconnect on the one error class where reconnecting is the fix. */
    reconnectOnError(error: Error): boolean {
      return error.message.includes("READONLY");
    },
    ...(useTls
      ? { tls: { rejectUnauthorized: env.REDIS_TLS_REJECT_UNAUTHORIZED } }
      : {}),
  };
}

/** Never let a Redis error message reach a log line with its host or auth in it. */
function safeReason(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const code = (error as NodeJS.ErrnoException).code;
  if (code) return code;
  return error.name || "error";
}

/**
 * A loopback address is reachable from a laptop and from a container that runs
 * Redis as a sidecar. It is never reachable from a serverless function, where
 * dialling it costs a full connect timeout on every cold start and can only
 * ever fail. Detecting it here turns a recurring multi-second stall into one
 * log line and a straight-to-database read path.
 */
function unreachableFromHere(url: string): boolean {
  if (!isServerless) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function initRedis(): Redis | null {
  if (!cacheEnabled || !env.REDIS_URL) {
    health = "disabled";
    if (env.REDIS_ENABLED && !env.REDIS_URL) {
      logger.warn("Cache disabled: REDIS_URL is not set. Reads go straight to the database.");
    }
    return null;
  }

  if (client) return client;

  if (unreachableFromHere(env.REDIS_URL)) {
    health = "disabled";
    logger.warn(
      "Cache disabled: REDIS_URL points at localhost, which a serverless function cannot reach. " +
        "Point it at a hosted Redis (rediss://...) or set REDIS_ENABLED=false.",
    );
    return null;
  }

  const instance = new Redis(env.REDIS_URL, buildOptions(env.REDIS_URL));

  instance.on("ready", () => {
    health = "ok";
    logger.info("Redis ready");
  });

  instance.on("close", () => {
    if (!closing && health === "ok") health = "degraded";
  });

  instance.on("end", () => {
    if (!closing) health = "degraded";
  });

  instance.on("reconnecting", () => {
    if (health === "ok") health = "degraded";
  });

  instance.on("error", (error: unknown) => {
    health = "degraded";
    const now = Date.now();
    if (now - lastErrorLoggedAt > ERROR_LOG_INTERVAL_MS) {
      lastErrorLoggedAt = now;
      logger.warn("Redis unavailable: bypassing cache", { reason: safeReason(error) });
    }
  });

  client = instance;

  // `lazyConnect` means nothing happens until this call. A failure here is not
  // fatal — the error handler above marks the client degraded and ioredis keeps
  // retrying in the background while requests fall through to Supabase.
  void instance.connect().catch(() => {
    health = "degraded";
  });

  return instance;
}

/** The shared client, or null when caching is switched off entirely. */
export function getRedis(): Redis | null {
  return client;
}

/**
 * Connect on first use rather than at boot.
 *
 * `initRedis()` used to be called from server.ts only, which meant that on a
 * serverless host - where server.ts never runs - the client stayed null and the
 * cache silently did nothing for the life of the deployment. Every read went to
 * Supabase and `/health` reported the cache as connecting forever.
 *
 * Calling this from the cache layer instead makes the connection open on the
 * first request an instance handles, and be reused by every request after it.
 * `initRedis()` is idempotent, so a long-lived server that already called it at
 * boot is unaffected.
 */
export function ensureRedis(): Redis | null {
  if (client) return client;
  if (!cacheEnabled) return null;
  return initRedis();
}

/** True only when a command has a realistic chance of succeeding right now. */
export function isRedisReady(): boolean {
  return client !== null && client.status === "ready";
}

export function redisHealth(): RedisHealth {
  if (!cacheEnabled) return "disabled";
  // An explicit close (shutdown, or caching switched off at runtime) is not the
  // same thing as an outage, and a health probe should not read like one.
  if (health === "disabled") return "disabled";
  if (isRedisReady()) return "ok";
  return health === "connecting" ? "connecting" : "degraded";
}

/** Close cleanly on SIGTERM/SIGINT so no socket is left hanging. */
export async function closeRedis(): Promise<void> {
  if (!client) return;
  closing = true;

  try {
    await client.quit();
  } catch {
    client.disconnect();
  } finally {
    client = null;
    health = "disabled";
  }
}
