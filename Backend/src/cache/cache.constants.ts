import { env } from "../config/env.ts";

/**
 * Every tunable the cache layer has, in one file.
 *
 * TTLs are a safety net, not the freshness mechanism: admin mutations bump the
 * family version (see cache.keys.ts) so an edit is visible on the next request.
 * The times below only decide how long an entry survives when nothing changes.
 */

/** Bump when the shape of any cached public DTO changes. */
export const CACHE_DTO_VERSION = "v1";

/**
 * Keys are namespaced by deployment as well as by application, so a staging
 * instance pointed at the same managed Redis cannot serve production traffic
 * its own data.
 */
export const CACHE_NAMESPACE = `${env.REDIS_KEY_PREFIX}:${env.NODE_ENV}:public`;

/** Hash holding the monotonic version counter for each cache family. */
export const CACHE_VERSION_HASH = `${CACHE_NAMESPACE}:versions`;

/** Prefix for the short-lived single-flight locks. */
export const CACHE_LOCK_PREFIX = `${CACHE_NAMESPACE}:lock`;

/**
 * A cache family is a group of entries that go stale together. A key may belong
 * to several — a collection page is invalidated by both a collection edit and a
 * product edit — which is how dependent invalidation stays a single command.
 */
export const CACHE_FAMILIES = [
  "collections",
  "products",
  "newArrivals",
  "featured",
  "gallery",
  "siteSettings",
] as const;

export type CacheFamily = (typeof CACHE_FAMILIES)[number];

/* ── time to live ──────────────────────────────────────────── */

const DEFAULT_TTL = env.REDIS_DEFAULT_TTL_SECONDS;

/** Collections change rarely — a new counter is a once-a-season event. */
export const CACHE_TTL_COLLECTIONS = 900; // 15 minutes

/** Product listings move with the catalogue, so a shorter window. */
export const CACHE_TTL_PRODUCTS = 600; // 10 minutes

export const CACHE_TTL_PRODUCT_DETAIL = 600; // 10 minutes

/** The one list the shop touches most often during a working day. */
export const CACHE_TTL_NEW_ARRIVALS = 300; // 5 minutes

export const CACHE_TTL_FEATURED = 600; // 10 minutes

export const CACHE_TTL_GALLERY = 900; // 15 minutes

/** Phone numbers and hours: rarely edited, and wrong for no longer than this. */
export const CACHE_TTL_SITE_SETTINGS = 600; // 10 minutes

/** Used only if a call site forgets to name one. */
export const CACHE_TTL_DEFAULT = DEFAULT_TTL;

/* ── single-flight ─────────────────────────────────────────── */

/** How long one instance may hold the "I am loading this" lock. */
export const CACHE_LOCK_TTL_MS = 5_000;

/** How long a waiting request will poll for someone else's result. */
export const CACHE_LOCK_WAIT_MS = 900;

export const CACHE_LOCK_POLL_MS = 25;
