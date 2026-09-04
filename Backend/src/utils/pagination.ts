/**
 * Paging bounds, kept apart for the two audiences.
 *
 * The public site pages a long catalogue into windows a phone can actually
 * render, and the ceiling stops `?limit=10000` from turning one request into a
 * full table scan that then lands in Redis as a single enormous entry. The
 * dashboard needs a wider ceiling because it moves products between
 * collections in bulk.
 *
 * 24 matches the grid the approved design already uses — three columns on the
 * collection pages, four on new arrivals — so a page always fills evenly.
 */

export type PageBounds = { default: number; max: number };

export const PUBLIC_PAGE_BOUNDS: PageBounds = { default: 24, max: 50 };

export const ADMIN_PAGE_BOUNDS: PageBounds = { default: 25, max: 100 };

/** Kept for callers that predate the split. */
export const DEFAULT_PAGE_SIZE = PUBLIC_PAGE_BOUNDS.default;
export const MAX_PAGE_SIZE = ADMIN_PAGE_BOUNDS.max;

export type PageRange = { page: number; limit: number; from: number; to: number };

/** Clamp caller-supplied paging into a Supabase `.range()` window. */
export function toRange(
  page?: number,
  limit?: number,
  bounds: PageBounds = PUBLIC_PAGE_BOUNDS,
): PageRange {
  const safePage =
    typeof page === "number" && Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const requested =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : bounds.default;

  const safeLimit = Math.min(Math.max(requested, 1), bounds.max);
  const from = (safePage - 1) * safeLimit;

  return { page: safePage, limit: safeLimit, from, to: from + safeLimit - 1 };
}

/**
 * Normalises paging *before* a cache key is built, so `?limit=999` and
 * `?limit=50` resolve to one entry rather than two identical ones.
 */
export function resolvePaging(
  page?: number,
  limit?: number,
  bounds: PageBounds = PUBLIC_PAGE_BOUNDS,
): { page: number; limit: number } {
  const range = toRange(page, limit, bounds);
  return { page: range.page, limit: range.limit };
}
