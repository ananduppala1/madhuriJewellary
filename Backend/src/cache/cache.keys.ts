import {
  CACHE_DTO_VERSION,
  CACHE_NAMESPACE,
  CACHE_TTL_COLLECTIONS,
  CACHE_TTL_FEATURED,
  CACHE_TTL_GALLERY,
  CACHE_TTL_NEW_ARRIVALS,
  CACHE_TTL_PRODUCTS,
  CACHE_TTL_PRODUCT_DETAIL,
  CACHE_TTL_SITE_SETTINGS,
} from "./cache.constants.ts";
import type { CacheDescriptor, CacheKeyParts } from "./cache.types.ts";

/**
 * Every Redis key the application writes is built here.
 *
 * Two properties are being defended:
 *
 *  · Determinism — `?page=1&limit=24` and `?limit=24&page=1` are the same
 *    request, so they must produce one entry rather than two.
 *  · Invalidation — a key names the families it belongs to, and the version
 *    token of each family is spliced in at read time. Bumping a counter
 *    therefore retires a whole group of entries with one command, without
 *    SCAN and without ever running KEYS in production.
 */

/* ── normalisation ─────────────────────────────────────────── */

/**
 * Collection identifiers arrive as "gold-jewellery", "/gold-jewellery" or with
 * stray casing, and the API treats all three the same. So must the key.
 */
export function normaliseCollection(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
  return trimmed || undefined;
}

export function normaliseSlug(value: string): string {
  return value.trim().replace(/^\/+/, "").toLowerCase();
}

/**
 * Anything that could break the `:`-delimited key format, or smuggle a second
 * key into one, is percent-encoded. Free-text search terms are the reason this
 * exists.
 */
function encodeComponent(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function stringifyValue(value: NonNullable<CacheKeyParts[string]>): string {
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  return encodeComponent(value);
}

/**
 * Sorted `name=value` pairs. Undefined, null and empty values are dropped
 * entirely so an absent filter and a blank one share a key.
 */
export function serialiseParts(parts: CacheKeyParts): string {
  const pairs: string[] = [];

  for (const key of Object.keys(parts).sort()) {
    const value = parts[key];
    if (value === undefined || value === null || value === "") continue;
    pairs.push(`${key}=${stringifyValue(value)}`);
  }

  return pairs.join(":");
}

function compose(segments: (string | undefined)[]): string {
  return [CACHE_NAMESPACE, ...segments.filter((part): part is string => Boolean(part)), CACHE_DTO_VERSION].join(
    ":",
  );
}

/* ── descriptors ───────────────────────────────────────────── */

/** `GET /public/collections` — the full list with product counts. */
export function collectionsKey(): CacheDescriptor {
  return {
    key: compose(["collections"]),
    // Product counts sit on these cards, so a product edit retires them too.
    families: ["collections", "products"],
    ttl: CACHE_TTL_COLLECTIONS,
  };
}

/** `GET /public/collections/:slug` — hero, highlights, first page of products. */
export function collectionKey(identifier: string, page: number, limit: number): CacheDescriptor {
  return {
    key: compose([
      "collection",
      `slug=${encodeComponent(normaliseSlug(identifier))}`,
      serialiseParts({ page, limit }),
    ]),
    families: ["collections", "products"],
    ttl: CACHE_TTL_COLLECTIONS,
  };
}

export function relatedCollectionsKey(excludePath: string, limit: number): CacheDescriptor {
  return {
    key: compose([
      "collections:related",
      serialiseParts({ exclude: normaliseSlug(excludePath), limit }),
    ]),
    families: ["collections"],
    ttl: CACHE_TTL_COLLECTIONS,
  };
}

export type ProductListKeyInput = {
  collection?: string | undefined;
  badge?: string | undefined;
  newArrivals?: boolean | undefined;
  featured?: boolean | undefined;
  search?: string | undefined;
  page: number;
  limit: number;
};

/**
 * One builder for every product listing, so `/products?featured=true` and
 * `/featured` cannot drift into two differently-shaped entries. The family
 * list narrows to whichever flag is set, which keeps a "new arrival" toggle
 * from retiring the whole catalogue.
 */
export function productListKey(input: ProductListKeyInput): CacheDescriptor {
  const collection = normaliseCollection(input.collection);
  const search = input.search?.trim().toLowerCase();

  const families: ("collections" | "products" | "newArrivals" | "featured")[] = ["products"];
  if (input.newArrivals) families.push("newArrivals");
  if (input.featured) families.push("featured");
  if (collection) families.push("collections");

  const scope = input.newArrivals ? "new-arrivals" : input.featured ? "featured" : "products";

  return {
    key: compose([
      scope,
      serialiseParts({
        collection,
        badge: input.badge,
        search,
        page: input.page,
        limit: input.limit,
      }),
    ]),
    families,
    ttl: input.newArrivals
      ? CACHE_TTL_NEW_ARRIVALS
      : input.featured
        ? CACHE_TTL_FEATURED
        : CACHE_TTL_PRODUCTS,
  };
}

/** `GET /public/products/:slug`. */
export function productKey(slug: string): CacheDescriptor {
  return {
    key: compose(["product", `slug=${encodeComponent(normaliseSlug(slug))}`]),
    families: ["products", "collections"],
    ttl: CACHE_TTL_PRODUCT_DETAIL,
  };
}

/** The "you may also like" strip on a product page. */
export function relatedProductsKey(slug: string, limit: number): CacheDescriptor {
  return {
    key: compose([
      "product:related",
      serialiseParts({ slug: normaliseSlug(slug), limit }),
    ]),
    families: ["products", "collections"],
    ttl: CACHE_TTL_PRODUCT_DETAIL,
  };
}

/** `GET /public/gallery`, optionally filtered by category. */
export function galleryKey(category?: string | undefined): CacheDescriptor {
  return {
    key: compose(["gallery", serialiseParts({ category })]),
    families: ["gallery"],
    ttl: CACHE_TTL_GALLERY,
  };
}

/** `GET /public/site-settings`. */
export function siteSettingsKey(): CacheDescriptor {
  return {
    key: compose(["site-settings"]),
    families: ["siteSettings"],
    ttl: CACHE_TTL_SITE_SETTINGS,
  };
}
