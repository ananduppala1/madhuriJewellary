export const API_PREFIX = "/api/v1";

export const PRODUCT_BADGES = [
  "New",
  "Best Seller",
  "Bridal Pick",
  "Limited",
  "Made to Order",
] as const;

export const GALLERY_CATEGORIES = ["Store", "Jewellery", "Craft", "Moments"] as const;

export const GALLERY_SPANS = ["normal", "wide", "tall"] as const;

export const ADMIN_ROLES = ["admin", "editor"] as const;

/** Cookie names for the admin session. Both are HTTP-only. */
export const ACCESS_COOKIE = "mj_at";
export const REFRESH_COOKIE = "mj_rt";

/** Accepted image uploads. Both the MIME type and the extension must match. */
export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif"] as const;

export const MAX_IMAGES_PER_PRODUCT = 12;

/**
 * How long public GET responses may be cached by a browser or CDN.
 *
 * This is the *HTTP* cache and it is deliberately short. It cannot be purged
 * when the shop saves a change, so a long window here is exactly what would
 * make an edit look like it had not taken effect. Redis is what makes the
 * origin fast, and Redis is invalidated on every mutation — so the header only
 * needs to absorb bursts, not carry the load.
 *
 * An operator who wants edge changes to be instant can set s-maxage=0; the
 * origin will still answer from Redis in single-digit milliseconds.
 */
export const PUBLIC_CACHE_CONTROL =
  "public, max-age=30, s-maxage=60, stale-while-revalidate=60";
