import { api, type Paged } from "@/lib/api-client";
import type {
  Collection,
  CollectionSummary,
  GalleryCategory,
  GalleryItem,
  Product,
  ProductDetail,
  SiteSettings,
} from "@/types/api";

type Options = { signal?: AbortSignal };

export type { Paged };

/** Matches the backend's public ceiling, so a page request is never rejected. */
export const PAGE_SIZE = 24;

export function getCollections(options: Options = {}) {
  return api.request<CollectionSummary[]>("/collections", options);
}

/**
 * Accepts either a slug ("gold-jewellery") or a route path ("/gold-jewellery").
 * The response carries the collection plus its first page of products; further
 * pages come from `getProductPage` below.
 */
export function getCollection(
  identifier: string,
  query: { page?: number; limit?: number } = {},
  options: Options = {},
) {
  return api.request<Collection>(`/collections/${identifier.replace(/^\/+/, "")}`, {
    ...options,
    query: { page: query.page, limit: query.limit },
  });
}

export type ProductQuery = {
  collection?: string;
  badge?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export function getProducts(query: ProductQuery = {}, options: Options = {}) {
  return api.request<Product[]>("/products", { ...options, query });
}

/** The same endpoint, keeping `meta` so a grid knows whether more pages exist. */
export function getProductPage(query: ProductQuery = {}, options: Options = {}) {
  return api.requestPage<Product>("/products", { ...options, query });
}

export function getProduct(slug: string, options: Options = {}) {
  return api.request<ProductDetail>(`/products/${slug}`, options);
}

export function getNewArrivalPage(
  query: { page?: number; limit?: number } = {},
  options: Options = {},
) {
  return api.requestPage<Product>("/new-arrivals", { ...options, query });
}

export function getFeatured(limit = 6, options: Options = {}) {
  return api.request<Product[]>("/featured", { ...options, query: { limit } });
}

export function getGallery(category?: GalleryCategory, options: Options = {}) {
  return api.request<GalleryItem[]>("/gallery", {
    ...options,
    ...(category ? { query: { category } } : {}),
  });
}

export function getSiteSettings(options: Options = {}) {
  return api.request<SiteSettings>("/site-settings", options);
}

/* ── prefetching ───────────────────────────────────────────── */

/**
 * Warms a product detail response while the visitor is still deciding.
 *
 * Deliberately *not* a second cache. Nothing is stored here — no map of
 * products, no localStorage, no duplicate catalogue in the browser — because a
 * client-side copy is exactly how a site ends up showing something the shop has
 * already changed. All this does is send the request early, so the work happens
 * in Redis before the click rather than after it. The `Set` holds slugs, not
 * data, purely so a shaky hover cannot fire the same request twice.
 */
const prefetched = new Set<string>();

export function prefetchProduct(slug: string): void {
  if (!slug || prefetched.has(slug)) return;
  prefetched.add(slug);

  void getProduct(slug).catch(() => {
    // A failed prefetch is a non-event: the page will ask again for real, and
    // that request is the one whose error the visitor should see.
    prefetched.delete(slug);
  });
}
