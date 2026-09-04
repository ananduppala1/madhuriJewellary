import { adminDb, publicDb } from "../config/supabase.js";
import type { Database, GalleryCategory, GalleryItemRow } from "../types/database.js";
import { raise, unwrapList, unwrapMaybe } from "./helpers.js";

const PUBLIC_COLUMNS =
  "id, caption, category, secure_url, width, height, span, sort_order";

const ADMIN_COLUMNS =
  "id, caption, category, cloudinary_public_id, secure_url, width, height, span, seed_key, sort_order, is_active, created_at, updated_at";

export type PublicGalleryRow = Pick<
  GalleryItemRow,
  "id" | "caption" | "category" | "secure_url" | "width" | "height" | "span" | "sort_order"
>;

export async function listPublic(category?: GalleryCategory): Promise<PublicGalleryRow[]> {
  let query = publicDb.from("gallery_items").select(PUBLIC_COLUMNS);
  if (category) query = query.eq("category", category);

  const result = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return unwrapList(result as never, "gallery.listPublic") as PublicGalleryRow[];
}

export async function listAdmin(filter: {
  category?: GalleryCategory;
  isActive?: boolean;
}): Promise<GalleryItemRow[]> {
  let query = adminDb.from("gallery_items").select(ADMIN_COLUMNS);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.isActive !== undefined) query = query.eq("is_active", filter.isActive);

  const result = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return unwrapList(result as never, "gallery.listAdmin") as GalleryItemRow[];
}

export async function findById(id: string): Promise<GalleryItemRow | null> {
  const result = await adminDb.from("gallery_items").select(ADMIN_COLUMNS).eq("id", id).maybeSingle();
  return unwrapMaybe(result as never, "gallery.findById") as GalleryItemRow | null;
}

export async function findBySeedKey(seedKey: string): Promise<GalleryItemRow | null> {
  const result = await adminDb
    .from("gallery_items")
    .select(ADMIN_COLUMNS)
    .eq("seed_key", seedKey)
    .maybeSingle();
  return unwrapMaybe(result as never, "gallery.findBySeedKey") as GalleryItemRow | null;
}

export async function insert(
  values: Database["public"]["Tables"]["gallery_items"]["Insert"],
): Promise<GalleryItemRow> {
  const result = await adminDb.from("gallery_items").insert(values).select(ADMIN_COLUMNS).single();
  if (result.error) raise(result.error, "gallery.insert");
  return result.data as unknown as GalleryItemRow;
}

export async function update(
  id: string,
  values: Database["public"]["Tables"]["gallery_items"]["Update"],
): Promise<GalleryItemRow> {
  const result = await adminDb
    .from("gallery_items")
    .update(values)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();
  if (result.error) raise(result.error, "gallery.update");
  return result.data as unknown as GalleryItemRow;
}

export async function remove(id: string): Promise<void> {
  const { error } = await adminDb.from("gallery_items").delete().eq("id", id);
  if (error) raise(error, "gallery.remove");
}

export async function count(onlyActive: boolean): Promise<number> {
  let query = adminDb.from("gallery_items").select("id", { count: "exact", head: true });
  if (onlyActive) query = query.eq("is_active", true);

  const { count: total, error } = await query;
  if (error) raise(error, "gallery.count");
  return total ?? 0;
}
