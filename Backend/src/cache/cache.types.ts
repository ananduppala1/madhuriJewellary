import type { CacheFamily } from "./cache.constants.ts";

/**
 * What goes into Redis. The envelope carries the DTO version so a deploy that
 * changes a public shape treats every older entry as a miss rather than
 * deserialising it into the wrong type.
 */
export type CacheEnvelope<T> = {
  /** DTO version, matching CACHE_DTO_VERSION at the time of writing. */
  v: string;
  /** Unix seconds the entry was written — used for diagnostics only. */
  t: number;
  /** The already-shaped public DTO. Never a raw database row. */
  d: T;
};

/** Describes one cacheable read. */
export type CacheDescriptor = {
  /** Fully-qualified key *without* the family version segments. */
  key: string;
  /** Families whose version tokens this entry depends on. */
  families: readonly CacheFamily[];
  /** Seconds. */
  ttl: number;
};

export type CacheOutcome = "hit" | "miss" | "bypass";

export type CacheMetricsSnapshot = {
  hits: number;
  misses: number;
  bypasses: number;
  setFailures: number;
  invalidationFailures: number;
  deserialisationFailures: number;
  coalescedWaits: number;
};

/** Values a normalised query component may take before it is stringified. */
export type CacheKeyValue = string | number | boolean | null | undefined;

export type CacheKeyParts = Record<string, CacheKeyValue>;
