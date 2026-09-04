import { adminDb, publicDb } from "../config/supabase.ts";
import type { Database, SiteSettingsRow } from "../types/database.ts";
import { raise, unwrapMaybe } from "./helpers.ts";

/**
 * Exactly one row exists, guaranteed by the `singleton` unique constraint. The
 * public projection leaves out ids and timestamps — the website has no use for
 * them and they say more about the storage than the business.
 */

const PUBLIC_COLUMNS =
  "business_name, legal_name, tagline, short_description, website_url, founded_year, phones, whatsapp_number, email, instagram_url, facebook_url, youtube_url, street, locality, city, region, postal_code, country, latitude, longitude, maps_query, hours, hours_short, rating, rating_count";

const ADMIN_COLUMNS = `id, singleton, ${PUBLIC_COLUMNS}, created_at, updated_at`;

export type PublicSettingsRow = Omit<
  SiteSettingsRow,
  "id" | "singleton" | "created_at" | "updated_at"
>;

export async function getPublic(): Promise<PublicSettingsRow | null> {
  const result = await publicDb.from("site_settings").select(PUBLIC_COLUMNS).limit(1).maybeSingle();
  return unwrapMaybe(result as never, "siteSettings.getPublic") as PublicSettingsRow | null;
}

export async function getAdmin(): Promise<SiteSettingsRow | null> {
  const result = await adminDb.from("site_settings").select(ADMIN_COLUMNS).limit(1).maybeSingle();
  return unwrapMaybe(result as never, "siteSettings.getAdmin") as SiteSettingsRow | null;
}

export async function upsert(
  values: Database["public"]["Tables"]["site_settings"]["Insert"],
): Promise<SiteSettingsRow> {
  const result = await adminDb
    .from("site_settings")
    .upsert({ ...values, singleton: true }, { onConflict: "singleton" })
    .select(ADMIN_COLUMNS)
    .single();

  if (result.error) raise(result.error, "siteSettings.upsert");
  return result.data as unknown as SiteSettingsRow;
}

export async function update(
  id: string,
  values: Database["public"]["Tables"]["site_settings"]["Update"],
): Promise<SiteSettingsRow> {
  const result = await adminDb
    .from("site_settings")
    .update(values)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();

  if (result.error) raise(result.error, "siteSettings.update");
  return result.data as unknown as SiteSettingsRow;
}
