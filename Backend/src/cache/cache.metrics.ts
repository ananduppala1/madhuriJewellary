import type { CacheMetricsSnapshot } from "./cache.types.js";

/**
 * Counters, not a metrics pipeline. They exist so `/health` can answer "is the
 * cache actually doing anything" and so a local before/after measurement does
 * not need a profiler. Nothing here holds a cached value, a key or a payload.
 */

const counters: CacheMetricsSnapshot = {
  hits: 0,
  misses: 0,
  bypasses: 0,
  setFailures: 0,
  invalidationFailures: 0,
  deserialisationFailures: 0,
  coalescedWaits: 0,
};

export const cacheMetrics = {
  hit: () => void (counters.hits += 1),
  miss: () => void (counters.misses += 1),
  bypass: () => void (counters.bypasses += 1),
  setFailure: () => void (counters.setFailures += 1),
  invalidationFailure: () => void (counters.invalidationFailures += 1),
  deserialisationFailure: () => void (counters.deserialisationFailures += 1),
  coalescedWait: () => void (counters.coalescedWaits += 1),

  snapshot(): CacheMetricsSnapshot & { hitRate: number | null } {
    const reads = counters.hits + counters.misses;
    return {
      ...counters,
      hitRate: reads === 0 ? null : Math.round((counters.hits / reads) * 1000) / 1000,
    };
  },

  reset(): void {
    for (const key of Object.keys(counters) as (keyof CacheMetricsSnapshot)[]) {
      counters[key] = 0;
    }
  },
};
