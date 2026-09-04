import { CACHE_FAMILIES, type CacheFamily } from "./cache.constants.js";
import { invalidateFamilies } from "./cache.service.js";

/**
 * Which admin action retires which cached reads.
 *
 * The rule this file exists to enforce: a mutation is never allowed to leave a
 * public page showing the previous value until a TTL runs out. Because a key
 * carries the version token of every family it depends on, "retire the
 * collection pages as well" costs one more counter in the same pipeline rather
 * than a scan for matching keys.
 *
 * All of these run *after* the database write has succeeded.
 */

/** Flags whose change ripples beyond the product's own pages. */
export type ProductChange = {
  /** is_new_arrival was set, cleared, or the row was created/deleted with it on. */
  newArrival?: boolean;
  /** is_featured was set, cleared, or the row was created/deleted with it on. */
  featured?: boolean;
};

/**
 * Products appear in listings, on collection pages (which also carry the
 * per-collection product count) and inside the related-products strip, so a
 * single edit touches more than the product's own key.
 */
export async function invalidateProduct(change: ProductChange = {}): Promise<boolean> {
  const families: CacheFamily[] = ["products", "collections"];
  if (change.newArrival) families.push("newArrivals");
  if (change.featured) families.push("featured");
  return invalidateFamilies(families);
}

/**
 * Images are embedded in every product DTO — cards, detail pages and related
 * strips alike — so an image change retires the same set as a product edit.
 */
export async function invalidateProductImages(): Promise<boolean> {
  return invalidateFamilies(["products", "collections"]);
}

/**
 * A collection edit changes its own page and the collection reference carried
 * inside every product DTO, so both families go.
 */
export async function invalidateCollections(): Promise<boolean> {
  return invalidateFamilies(["collections", "products"]);
}

export async function invalidateGallery(): Promise<boolean> {
  return invalidateFamilies(["gallery"]);
}

export async function invalidateSiteSettings(): Promise<boolean> {
  return invalidateFamilies(["siteSettings"]);
}

/** Used by the reorder endpoints, which can move products across every list. */
export async function invalidateCatalogue(): Promise<boolean> {
  return invalidateFamilies(["products", "collections", "newArrivals", "featured"]);
}

/** Escape hatch for operations whose blast radius is not worth reasoning about. */
export async function invalidateEverything(): Promise<boolean> {
  return invalidateFamilies(CACHE_FAMILIES);
}
