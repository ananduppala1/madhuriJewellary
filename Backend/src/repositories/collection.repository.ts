import { adminDb, publicDb } from "../config/supabase.js";
import type {
  CollectionHighlightRow,
  CollectionRow,
  Database,
} from "../types/database.js";
import { raise, unwrapList, unwrapMaybe } from "./helpers.js";

type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];
type CollectionUpdate = Database["public"]["Tables"]["collections"]["Update"];

/** Only the columns the public site renders — never `select *` on a public path. */
export const PUBLIC_COLUMNS =
  "id, slug, path, name, eyebrow, hero_title, hero_line, intro, banner_image_url, seo_title, seo_description, craft_note, sort_order";

const ADMIN_COLUMNS =
  "id, slug, path, name, eyebrow, hero_title, hero_line, intro, banner_image_url, banner_public_id, seo_title, seo_description, craft_note, sort_order, is_active, created_at, updated_at";

export type PublicCollectionRow = Pick<
  CollectionRow,
  | "id"
  | "slug"
  | "path"
  | "name"
  | "eyebrow"
  | "hero_title"
  | "hero_line"
  | "intro"
  | "banner_image_url"
  | "seo_title"
  | "seo_description"
  | "craft_note"
  | "sort_order"
>;

/* ── public reads (anon key, so RLS applies) ───────────────── */

export async function listPublic(): Promise<PublicCollectionRow[]> {
  const result = await publicDb
    .from("collections")
    .select(PUBLIC_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return unwrapList(result as never, "collections.listPublic");
}

export async function findPublicBySlugOrPath(
  identifier: string,
): Promise<PublicCollectionRow | null> {
  const slug = identifier.replace(/^\/+/, "");
  const result = await publicDb
    .from("collections")
    .select(PUBLIC_COLUMNS)
    .or(`slug.eq.${slug},path.eq./${slug}`)
    .limit(1)
    .maybeSingle();

  return unwrapMaybe(result as never, "collections.findPublicBySlugOrPath");
}

export async function listHighlights(collectionIds: string[]) {
  if (collectionIds.length === 0) return [] as CollectionHighlightRow[];

  const result = await publicDb
    .from("collection_highlights")
    .select("id, collection_id, label, value, sort_order")
    .in("collection_id", collectionIds)
    .order("sort_order", { ascending: true });

  return unwrapList(result as never, "collections.listHighlights") as CollectionHighlightRow[];
}

/* ── admin reads and writes (service role) ─────────────────── */

export async function listAll(): Promise<CollectionRow[]> {
  const result = await adminDb
    .from("collections")
    .select(ADMIN_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return unwrapList(result as never, "collections.listAll") as CollectionRow[];
}

export async function findById(id: string): Promise<CollectionRow | null> {
  const result = await adminDb.from("collections").select(ADMIN_COLUMNS).eq("id", id).maybeSingle();
  return unwrapMaybe(result as never, "collections.findById") as CollectionRow | null;
}

export async function findBySlug(slug: string): Promise<CollectionRow | null> {
  const result = await adminDb
    .from("collections")
    .select(ADMIN_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return unwrapMaybe(result as never, "collections.findBySlug") as CollectionRow | null;
}

export async function insert(values: CollectionInsert): Promise<CollectionRow> {
  const result = await adminDb.from("collections").insert(values).select(ADMIN_COLUMNS).single();
  if (result.error) raise(result.error, "collections.insert");
  return result.data as unknown as CollectionRow;
}

export async function update(id: string, values: CollectionUpdate): Promise<CollectionRow> {
  const result = await adminDb
    .from("collections")
    .update(values)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();
  if (result.error) raise(result.error, "collections.update");
  return result.data as unknown as CollectionRow;
}

export async function remove(id: string): Promise<void> {
  const { error } = await adminDb.from("collections").delete().eq("id", id);
  if (error) raise(error, "collections.remove");
}

export async function replaceHighlights(
  collectionId: string,
  highlights: { label: string; value: string }[],
): Promise<void> {
  const { error: deleteError } = await adminDb
    .from("collection_highlights")
    .delete()
    .eq("collection_id", collectionId);
  if (deleteError) raise(deleteError, "collections.replaceHighlights.delete");

  if (highlights.length === 0) return;

  const { error } = await adminDb.from("collection_highlights").insert(
    highlights.map((item, index) => ({
      collection_id: collectionId,
      label: item.label,
      value: item.value,
      sort_order: index,
    })),
  );
  if (error) raise(error, "collections.replaceHighlights.insert");
}

export async function listAdminHighlights(collectionIds: string[]) {
  if (collectionIds.length === 0) return [] as CollectionHighlightRow[];

  const result = await adminDb
    .from("collection_highlights")
    .select("id, collection_id, label, value, sort_order")
    .in("collection_id", collectionIds)
    .order("sort_order", { ascending: true });

  return unwrapList(result as never, "collections.listAdminHighlights") as CollectionHighlightRow[];
}

/**
 * Ids of products sitting in one collection, a page at a time. Used when a
 * collection is being emptied before deletion — the caller keeps asking until
 * the list comes back empty, so no product is left behind.
 */
export async function listAdminProductsIn(
  collectionId: string,
  limit: number,
): Promise<{ id: string }[]> {
  const result = await adminDb
    .from("products")
    .select("id")
    .eq("collection_id", collectionId)
    .limit(limit);

  return unwrapList(result as never, "collections.listAdminProductsIn") as { id: string }[];
}

/**
 * Product tallies for every collection in one round trip — the alternative is
 * a count query per collection, which is the N+1 this avoids.
 */
export async function countProductsByCollection(
  onlyActive: boolean,
): Promise<Map<string, number>> {
  let query = adminDb.from("products").select("collection_id");
  if (onlyActive) query = query.eq("is_active", true);

  const result = await query;
  const rows = unwrapList(result as never, "collections.countProductsByCollection") as {
    collection_id: string;
  }[];

  const tally = new Map<string, number>();
  for (const row of rows) {
    tally.set(row.collection_id, (tally.get(row.collection_id) ?? 0) + 1);
  }
  return tally;
}
