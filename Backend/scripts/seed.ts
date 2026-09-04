/**
 * Seeds Supabase and Cloudinary from the data the approved public website
 * already ships.
 *
 *   npm run seed
 *
 * Idempotent: every record is keyed on a stable identifier (collection slug,
 * product slug, gallery seed_key, Cloudinary public_id, the settings singleton)
 * and upserted. Running it twice updates rather than duplicates. Running it
 * against a database that already has admin edits will overwrite the seeded
 * fields on seeded rows — it is a bootstrap tool, not a sync tool.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CLOUDINARY_FOLDERS } from "../src/config/cloudinary.ts";
import { env } from "../src/config/env.ts";
import { adminDb } from "../src/config/supabase.ts";
import { assetExists, uploadImage } from "../src/services/cloudinary.service.ts";
import type { GalleryCategory, GallerySpan, ProductBadge } from "../src/types/database.ts";

import { collections as seedCollections } from "./data/collections.data.ts";
import { galleryItems as seedGallery } from "./data/gallery.data.ts";
import { site as seedSite } from "./data/site.data.ts";

const here = dirname(fileURLToPath(import.meta.url));
const ASSET_DIR = resolve(here, "../../frontend/src/assets");

/** Mock image keys in the frontend → the files that back them. */
const ASSET_FILES: Record<string, string> = {
  antique: "collection-antique.jpg",
  bangles: "collection-bangles.jpg",
  lightweight: "collection-lightweight.jpg",
  temple: "collection-temple.jpg",
  bridal: "hero-bridal.jpg",
  store: "store-interior.jpg",
};

type Asset = { publicId: string; secureUrl: string; width: number | null; height: number | null };

const log = (message: string) => console.log(`  ${message}`);
const step = (message: string) => console.log(`\n▸ ${message}`);

let created = 0;
let updated = 0;

/* ── images ────────────────────────────────────────────────── */

/**
 * Uploads each source photograph once under a fixed public_id. On a second run
 * Cloudinary already has the asset, so the upload is skipped entirely.
 */
async function seedAssets(): Promise<Map<string, Asset>> {
  step("Uploading seed imagery to Cloudinary");
  const assets = new Map<string, Asset>();

  for (const [key, filename] of Object.entries(ASSET_FILES)) {
    const publicId = `${CLOUDINARY_FOLDERS.seed}/${key}`;

    const existing = await assetExists(publicId);
    if (existing) {
      assets.set(key, existing);
      log(`· ${key} — already on Cloudinary`);
      continue;
    }

    const path = join(ASSET_DIR, filename);
    if (!existsSync(path)) {
      throw new Error(
        `Seed image missing: ${path}\nRun the seed from Backend/ with frontend/ alongside it.`,
      );
    }

    const asset = await uploadImage(
      { buffer: await readFile(path), originalname: filename },
      CLOUDINARY_FOLDERS.seed,
      { publicId: key, overwrite: true },
    );

    assets.set(key, asset);
    log(`+ ${key} — uploaded`);
  }

  return assets;
}

/* ── collections ───────────────────────────────────────────── */

async function seedCollectionRecords(assets: Map<string, Asset>) {
  step(`Seeding ${seedCollections.length} collections`);
  const idBySlug = new Map<string, string>();

  for (const [index, collection] of seedCollections.entries()) {
    const banner = assets.get(collection.banner);

    const values = {
      slug: collection.slug,
      path: collection.path,
      name: collection.name,
      eyebrow: collection.eyebrow,
      hero_title: collection.heroTitle,
      hero_line: collection.heroLine,
      intro: collection.intro,
      banner_image_url: banner?.secureUrl ?? null,
      banner_public_id: banner?.publicId ?? null,
      seo_title: collection.seoTitle,
      seo_description: collection.seoDescription,
      craft_note: collection.craftNote,
      sort_order: index,
      is_active: true,
    };

    const { data: existing } = await adminDb
      .from("collections")
      .select("id")
      .eq("slug", collection.slug)
      .maybeSingle();

    let id: string;

    if (existing) {
      const { data, error } = await adminDb
        .from("collections")
        .update(values)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw new Error(`collections.update ${collection.slug}: ${error.message}`);
      id = data.id;
      updated += 1;
    } else {
      const { data, error } = await adminDb.from("collections").insert(values).select("id").single();
      if (error) throw new Error(`collections.insert ${collection.slug}: ${error.message}`);
      id = data.id;
      created += 1;
    }

    idBySlug.set(collection.slug, id);

    // Highlights are small and fully owned by the collection, so replacing them
    // wholesale is simpler and cannot leave a stale row behind.
    await adminDb.from("collection_highlights").delete().eq("collection_id", id);
    if (collection.highlights.length > 0) {
      const { error } = await adminDb.from("collection_highlights").insert(
        collection.highlights.map((highlight, order) => ({
          collection_id: id,
          label: highlight.label,
          value: highlight.value,
          sort_order: order,
        })),
      );
      if (error) throw new Error(`highlights ${collection.slug}: ${error.message}`);
    }

    log(`· ${collection.name} (${collection.products.length} products)`);
  }

  return idBySlug;
}

/* ── products ──────────────────────────────────────────────── */

/**
 * Badges drive the flags the website now reads. `New` and `Made to Order` were
 * what the old `newArrivals` array selected on, and `Bridal Pick` plus
 * `Best Seller` were what the home page combined — so those become
 * is_new_arrival and is_featured respectively.
 */
function flagsFor(badge?: ProductBadge) {
  return {
    is_new_arrival: badge === "New" || badge === "Made to Order",
    is_featured: badge === "Bridal Pick" || badge === "Best Seller",
  };
}

async function seedProducts(collectionIds: Map<string, string>, assets: Map<string, Asset>) {
  const total = seedCollections.reduce((sum, c) => sum + c.products.length, 0);
  step(`Seeding ${total} products and their images`);

  for (const collection of seedCollections) {
    const collectionId = collectionIds.get(collection.slug);
    if (!collectionId) throw new Error(`Missing collection id for ${collection.slug}`);

    for (const [index, product] of collection.products.entries()) {
      const values = {
        slug: product.slug,
        name: product.name,
        description: product.description,
        purity: product.purity,
        weight: product.weight,
        designs: product.designs,
        badge: product.badge ?? null,
        collection_id: collectionId,
        ...flagsFor(product.badge),
        is_active: true,
        sort_order: index,
      };

      const { data: existing } = await adminDb
        .from("products")
        .select("id")
        .eq("slug", product.slug)
        .maybeSingle();

      let productId: string;

      if (existing) {
        const { data, error } = await adminDb
          .from("products")
          .update(values)
          .eq("id", existing.id)
          .select("id")
          .single();
        if (error) throw new Error(`products.update ${product.slug}: ${error.message}`);
        productId = data.id;
        updated += 1;
      } else {
        const { data, error } = await adminDb.from("products").insert(values).select("id").single();
        if (error) throw new Error(`products.insert ${product.slug}: ${error.message}`);
        productId = data.id;
        created += 1;
      }

      const asset = assets.get(product.image);
      if (!asset) continue;

      // Keyed on (product_id, cloudinary_public_id), which the table enforces —
      // so a re-run updates this row instead of adding a duplicate image.
      const { data: existingImage } = await adminDb
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .eq("cloudinary_public_id", asset.publicId)
        .maybeSingle();

      const imageValues = {
        product_id: productId,
        cloudinary_public_id: asset.publicId,
        secure_url: asset.secureUrl,
        width: asset.width,
        height: asset.height,
        alt_text: `${product.name} — ${product.purity} at Madhuri Jewellers, Secunderabad`,
        sort_order: 0,
        is_primary: true,
      };

      if (existingImage) {
        const { error } = await adminDb
          .from("product_images")
          .update(imageValues)
          .eq("id", existingImage.id);
        if (error) throw new Error(`product_images.update ${product.slug}: ${error.message}`);
      } else {
        // Only one image may be primary; clear any other before inserting.
        await adminDb
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", productId)
          .eq("is_primary", true);

        const { error } = await adminDb.from("product_images").insert(imageValues);
        if (error) throw new Error(`product_images.insert ${product.slug}: ${error.message}`);
      }
    }
  }

  log(`${total} products processed`);
}

/* ── gallery ───────────────────────────────────────────────── */

async function seedGalleryItems(assets: Map<string, Asset>) {
  step(`Seeding ${seedGallery.length} gallery items`);

  for (const [index, item] of seedGallery.entries()) {
    const asset = assets.get(item.image);
    if (!asset) continue;

    const values = {
      caption: item.caption,
      category: item.category as GalleryCategory,
      cloudinary_public_id: asset.publicId,
      secure_url: asset.secureUrl,
      width: asset.width,
      height: asset.height,
      span: item.span as GallerySpan,
      seed_key: item.id,
      sort_order: index,
      is_active: true,
    };

    const { data: existing } = await adminDb
      .from("gallery_items")
      .select("id")
      .eq("seed_key", item.id)
      .maybeSingle();

    if (existing) {
      const { error } = await adminDb.from("gallery_items").update(values).eq("id", existing.id);
      if (error) throw new Error(`gallery.update ${item.id}: ${error.message}`);
      updated += 1;
    } else {
      const { error } = await adminDb.from("gallery_items").insert(values);
      if (error) throw new Error(`gallery.insert ${item.id}: ${error.message}`);
      created += 1;
    }
  }

  log(`${seedGallery.length} gallery items processed`);
}

/* ── site settings ─────────────────────────────────────────── */

async function seedSiteSettings() {
  step("Seeding site settings");

  const values = {
    singleton: true,
    business_name: seedSite.name,
    legal_name: seedSite.legalName,
    tagline: seedSite.tagline,
    short_description: seedSite.shortDescription,
    website_url: seedSite.url,
    founded_year: seedSite.founded,
    phones: [...seedSite.phones],
    whatsapp_number: seedSite.whatsapp,
    email: seedSite.email,
    instagram_url: seedSite.instagram,
    facebook_url: seedSite.facebook,
    youtube_url: seedSite.youtube,
    street: seedSite.address.street,
    locality: seedSite.address.locality,
    city: seedSite.address.city,
    region: seedSite.address.region,
    postal_code: seedSite.address.postalCode,
    country: seedSite.address.country,
    latitude: seedSite.geo.lat,
    longitude: seedSite.geo.lng,
    maps_query: seedSite.mapsQuery,
    hours: seedSite.hours.map((row) => ({ days: row.days, time: row.time })),
    hours_short: seedSite.hoursShort,
    rating: seedSite.rating,
    rating_count: seedSite.ratingCount,
  };

  const { error } = await adminDb
    .from("site_settings")
    .upsert(values, { onConflict: "singleton" });

  if (error) throw new Error(`site_settings: ${error.message}`);
  log(`· ${seedSite.name}`);
}

/* ── administrator ─────────────────────────────────────────── */

/**
 * Creates the dashboard login from ADMIN_EMAIL / ADMIN_PASSWORD. Nothing is
 * hardcoded, and the password is never echoed. If the user already exists the
 * password is left alone unless RESET_ADMIN_PASSWORD=true is set.
 */
async function seedAdministrator() {
  step("Verifying administrator account");

  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_PASSWORD;

  if (!email || !password) {
    log("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping. Set them and re-run to create a login.");
    return;
  }

  const { data: list, error: listError } = await adminDb.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw new Error(`auth.listUsers: ${listError.message}`);

  const existing = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  let userId: string;

  if (existing) {
    userId = existing.id;
    log("· Auth user already exists");

    if (process.env.RESET_ADMIN_PASSWORD === "true") {
      const { error } = await adminDb.auth.admin.updateUserById(userId, { password });
      if (error) throw new Error(`auth.updateUser: ${error.message}`);
      log("· Password reset from ADMIN_PASSWORD");
    }
  } else {
    const { data, error } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`auth.createUser: ${error?.message ?? "unknown"}`);
    userId = data.user.id;
    log("+ Auth user created");
  }

  const { error: profileError } = await adminDb.from("admin_users").upsert(
    {
      id: userId,
      email: email.toLowerCase(),
      full_name: env.ADMIN_NAME ?? "Administrator",
      role: "admin",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`admin_users: ${profileError.message}`);

  log(`· Dashboard access granted to ${email}`);
}

/* ── entry point ───────────────────────────────────────────── */

async function main() {
  console.log("\nMadhuri Jewellers — seeding Supabase and Cloudinary");
  console.log("──────────────────────────────────────────────────");

  const assets = await seedAssets();
  const collectionIds = await seedCollectionRecords(assets);
  await seedProducts(collectionIds, assets);
  await seedGalleryItems(assets);
  await seedSiteSettings();
  await seedAdministrator();

  console.log("\n──────────────────────────────────────────────────");
  console.log(`Done. ${created} records created, ${updated} updated.\n`);
}

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
