import { adminDb, publicDb } from "../config/supabase.js";
import type { Database, ProductBadge, ProductImageRow, ProductRow } from "../types/database.js";
import { ADMIN_PAGE_BOUNDS, toRange } from "../utils/pagination.js";
import { escapeLikePattern } from "../utils/search.js";
import { raise, unwrapList, unwrapMaybe } from "./helpers.js";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

const PUBLIC_COLUMNS =
  "id, slug, name, description, purity, weight, designs, badge, collection_id, is_new_arrival, is_featured, sort_order";

const ADMIN_COLUMNS =
  "id, slug, name, description, purity, weight, designs, badge, collection_id, is_new_arrival, is_featured, is_active, sort_order, created_at, updated_at";

const IMAGE_COLUMNS =
  "id, product_id, cloudinary_public_id, secure_url, width, height, alt_text, sort_order, is_primary, created_at";

export type PublicProductRow = Pick<
  ProductRow,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "purity"
  | "weight"
  | "designs"
  | "badge"
  | "collection_id"
  | "is_new_arrival"
  | "is_featured"
  | "sort_order"
>;

export type PublicProductFilter = {
  collectionIds?: string[];
  newArrivals?: boolean;
  featured?: boolean;
  badge?: ProductBadge;
  search?: string;
  page?: number;
  limit?: number;
};

/* ── public reads ──────────────────────────────────────────── */

export async function listPublic(
  filter: PublicProductFilter,
): Promise<{ rows: PublicProductRow[]; total: number; page: number; limit: number }> {
  const { page, limit, from, to } = toRange(filter.page, filter.limit);

  let query = publicDb.from("products").select(PUBLIC_COLUMNS, { count: "exact" });

  if (filter.collectionIds?.length) query = query.in("collection_id", filter.collectionIds);
  if (filter.newArrivals) query = query.eq("is_new_arrival", true);
  if (filter.featured) query = query.eq("is_featured", true);
  if (filter.badge) query = query.eq("badge", filter.badge);

  if (filter.search) {
    const term = escapeLikePattern(filter.search);
    if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const result = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, to);

  if (result.error) raise(result.error, "products.listPublic");

  return {
    rows: (result.data ?? []) as unknown as PublicProductRow[],
    total: result.count ?? 0,
    page,
    limit,
  };
}

export async function findPublicBySlug(slug: string): Promise<PublicProductRow | null> {
  const result = await publicDb
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  return unwrapMaybe(result as never, "products.findPublicBySlug") as PublicProductRow | null;
}

/** All images for a batch of products in one query, keyed by product. */
export async function imagesForProducts(
  productIds: string[],
  scope: "public" | "admin" = "public",
): Promise<Map<string, ProductImageRow[]>> {
  const grouped = new Map<string, ProductImageRow[]>();
  if (productIds.length === 0) return grouped;

  const client = scope === "public" ? publicDb : adminDb;
  const result = await client
    .from("product_images")
    .select(IMAGE_COLUMNS)
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  const rows = unwrapList(result as never, "products.imagesForProducts") as ProductImageRow[];

  for (const row of rows) {
    const list = grouped.get(row.product_id);
    if (list) list.push(row);
    else grouped.set(row.product_id, [row]);
  }
  return grouped;
}

/* ── admin reads and writes ────────────────────────────────── */

export type AdminProductFilter = PublicProductFilter & {
  isActive?: boolean;
  collectionId?: string;
};

export async function listAdmin(
  filter: AdminProductFilter,
): Promise<{ rows: ProductRow[]; total: number; page: number; limit: number }> {
  const { page, limit, from, to } = toRange(filter.page, filter.limit, ADMIN_PAGE_BOUNDS);

  let query = adminDb.from("products").select(ADMIN_COLUMNS, { count: "exact" });

  if (filter.collectionId) query = query.eq("collection_id", filter.collectionId);
  if (filter.isActive !== undefined) query = query.eq("is_active", filter.isActive);
  if (filter.newArrivals !== undefined) query = query.eq("is_new_arrival", filter.newArrivals);
  if (filter.featured !== undefined) query = query.eq("is_featured", filter.featured);
  if (filter.badge) query = query.eq("badge", filter.badge);

  if (filter.search) {
    const term = escapeLikePattern(filter.search);
    if (term) query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const result = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, to);

  if (result.error) raise(result.error, "products.listAdmin");

  return {
    rows: (result.data ?? []) as unknown as ProductRow[],
    total: result.count ?? 0,
    page,
    limit,
  };
}

export async function findById(id: string): Promise<ProductRow | null> {
  const result = await adminDb.from("products").select(ADMIN_COLUMNS).eq("id", id).maybeSingle();
  return unwrapMaybe(result as never, "products.findById") as ProductRow | null;
}

export async function findBySlug(slug: string): Promise<ProductRow | null> {
  const result = await adminDb.from("products").select(ADMIN_COLUMNS).eq("slug", slug).maybeSingle();
  return unwrapMaybe(result as never, "products.findBySlug") as ProductRow | null;
}

export async function insert(values: ProductInsert): Promise<ProductRow> {
  const result = await adminDb.from("products").insert(values).select(ADMIN_COLUMNS).single();
  if (result.error) raise(result.error, "products.insert");
  return result.data as unknown as ProductRow;
}

export async function update(id: string, values: ProductUpdate): Promise<ProductRow> {
  const result = await adminDb
    .from("products")
    .update(values)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();
  if (result.error) raise(result.error, "products.update");
  return result.data as unknown as ProductRow;
}

export async function remove(id: string): Promise<void> {
  const { error } = await adminDb.from("products").delete().eq("id", id);
  if (error) raise(error, "products.remove");
}

export async function recentlyUpdated(limit: number): Promise<ProductRow[]> {
  const result = await adminDb
    .from("products")
    .select(ADMIN_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return unwrapList(result as never, "products.recentlyUpdated") as ProductRow[];
}

export async function countBy(filter: {
  isActive?: boolean;
  newArrival?: boolean;
  featured?: boolean;
}): Promise<number> {
  let query = adminDb.from("products").select("id", { count: "exact", head: true });
  if (filter.isActive !== undefined) query = query.eq("is_active", filter.isActive);
  if (filter.newArrival !== undefined) query = query.eq("is_new_arrival", filter.newArrival);
  if (filter.featured !== undefined) query = query.eq("is_featured", filter.featured);

  const { count, error } = await query;
  if (error) raise(error, "products.countBy");
  return count ?? 0;
}

/* ── product images ────────────────────────────────────────── */

export async function listImages(productId: string): Promise<ProductImageRow[]> {
  const result = await adminDb
    .from("product_images")
    .select(IMAGE_COLUMNS)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  return unwrapList(result as never, "productImages.list") as ProductImageRow[];
}

export async function findImage(id: string): Promise<ProductImageRow | null> {
  const result = await adminDb.from("product_images").select(IMAGE_COLUMNS).eq("id", id).maybeSingle();
  return unwrapMaybe(result as never, "productImages.find") as ProductImageRow | null;
}

export async function insertImage(
  values: Database["public"]["Tables"]["product_images"]["Insert"],
): Promise<ProductImageRow> {
  const result = await adminDb.from("product_images").insert(values).select(IMAGE_COLUMNS).single();
  if (result.error) raise(result.error, "productImages.insert");
  return result.data as unknown as ProductImageRow;
}

export async function updateImage(
  id: string,
  values: Database["public"]["Tables"]["product_images"]["Update"],
): Promise<ProductImageRow> {
  const result = await adminDb
    .from("product_images")
    .update(values)
    .eq("id", id)
    .select(IMAGE_COLUMNS)
    .single();
  if (result.error) raise(result.error, "productImages.update");
  return result.data as unknown as ProductImageRow;
}

export async function removeImage(id: string): Promise<void> {
  const { error } = await adminDb.from("product_images").delete().eq("id", id);
  if (error) raise(error, "productImages.remove");
}

/** Drop the primary flag across a product so a new primary can be set safely. */
export async function clearPrimary(productId: string): Promise<void> {
  const { error } = await adminDb
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId)
    .eq("is_primary", true);
  if (error) raise(error, "productImages.clearPrimary");
}
