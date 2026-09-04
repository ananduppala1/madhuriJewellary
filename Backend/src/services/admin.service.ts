import { CLOUDINARY_FOLDERS } from "../config/cloudinary.ts";
import * as invalidate from "../cache/cache.invalidation.ts";
import * as collectionRepo from "../repositories/collection.repository.ts";
import * as galleryRepo from "../repositories/gallery.repository.ts";
import * as productRepo from "../repositories/product.repository.ts";
import * as settingsRepo from "../repositories/siteSettings.repository.ts";
import type {
  BusinessHour,
  CollectionRow,
  GalleryCategory,
  GalleryItemRow,
  GallerySpan,
  SiteSettingsRow,
} from "../types/database.ts";
import { ApiError } from "../utils/ApiError.ts";
import { ADMIN_PAGE_BOUNDS } from "../utils/pagination.ts";
import { pathFromSlug, slugify } from "../utils/slug.ts";
import * as media from "./cloudinary.service.ts";
import type { UploadFile } from "./product.admin.service.ts";

/* ══ collections ═══════════════════════════════════════════ */

export type CollectionDto = CollectionRow & {
  highlights: { id: string; label: string; value: string; sortOrder: number }[];
  productCount: number;
};

export type CollectionInput = {
  name: string;
  slug?: string;
  path?: string;
  eyebrow?: string;
  heroTitle?: string;
  heroLine?: string | null;
  intro?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  craftNote?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  highlights?: { label: string; value: string }[];
};

async function decorateCollections(rows: CollectionRow[]): Promise<CollectionDto[]> {
  if (rows.length === 0) return [];

  const [highlights, counts] = await Promise.all([
    collectionRepo.listAdminHighlights(rows.map((row) => row.id)),
    collectionRepo.countProductsByCollection(false),
  ]);

  const grouped = new Map<string, CollectionDto["highlights"]>();
  for (const item of highlights) {
    const entry = {
      id: item.id,
      label: item.label,
      value: item.value,
      sortOrder: item.sort_order,
    };
    const list = grouped.get(item.collection_id);
    if (list) list.push(entry);
    else grouped.set(item.collection_id, [entry]);
  }

  return rows.map((row) => ({
    ...row,
    highlights: grouped.get(row.id) ?? [],
    productCount: counts.get(row.id) ?? 0,
  }));
}

export async function listCollections(): Promise<CollectionDto[]> {
  return decorateCollections(await collectionRepo.listAll());
}

export async function getCollection(id: string): Promise<CollectionDto> {
  const row = await collectionRepo.findById(id);
  if (!row) throw ApiError.notFound("That collection no longer exists");
  const [dto] = await decorateCollections([row]);
  return dto as CollectionDto;
}

export async function createCollection(input: CollectionInput): Promise<CollectionDto> {
  const slug = slugify(input.slug || input.name);
  if (!slug) throw ApiError.badRequest("The collection name must contain letters or numbers");

  const existing = await collectionRepo.findBySlug(slug);
  if (existing) throw ApiError.conflict("Another collection already uses that web address");

  const row = await collectionRepo.insert({
    slug,
    path: pathFromSlug(input.path ? slugify(input.path) : slug),
    name: input.name.trim(),
    eyebrow: input.eyebrow?.trim() ?? "",
    hero_title: (input.heroTitle || input.name).trim(),
    hero_line: input.heroLine ?? null,
    intro: input.intro ?? null,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    craft_note: input.craftNote ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  });

  if (input.highlights) await collectionRepo.replaceHighlights(row.id, input.highlights);

  await invalidate.invalidateCollections();

  return getCollection(row.id);
}

export async function updateCollection(
  id: string,
  input: Partial<CollectionInput>,
): Promise<CollectionDto> {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw ApiError.notFound("That collection no longer exists");

  const slug = input.slug ? slugify(input.slug) : undefined;
  if (slug) {
    const clash = await collectionRepo.findBySlug(slug);
    if (clash && clash.id !== id) {
      throw ApiError.conflict("Another collection already uses that web address");
    }
  }

  await collectionRepo.update(id, {
    ...(slug ? { slug } : {}),
    ...(input.path !== undefined ? { path: pathFromSlug(slugify(input.path)) } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.eyebrow !== undefined ? { eyebrow: input.eyebrow.trim() } : {}),
    ...(input.heroTitle !== undefined ? { hero_title: input.heroTitle.trim() } : {}),
    ...(input.heroLine !== undefined ? { hero_line: input.heroLine } : {}),
    ...(input.intro !== undefined ? { intro: input.intro } : {}),
    ...(input.seoTitle !== undefined ? { seo_title: input.seoTitle } : {}),
    ...(input.seoDescription !== undefined ? { seo_description: input.seoDescription } : {}),
    ...(input.craftNote !== undefined ? { craft_note: input.craftNote } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
  });

  if (input.highlights) await collectionRepo.replaceHighlights(id, input.highlights);

  /**
   * A collection's name, slug and path are copied into every product DTO, so
   * renaming one has to retire the product caches as well as its own page.
   * `invalidateCollections` bumps both families in a single pipeline.
   */
  await invalidate.invalidateCollections();

  return getCollection(id);
}

export async function setCollectionBanner(
  id: string,
  file: UploadFile,
): Promise<CollectionDto> {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw ApiError.notFound("That collection no longer exists");

  const asset = await media.uploadImage(file, CLOUDINARY_FOLDERS.collections, {
    publicId: existing.slug,
    overwrite: true,
  });

  await collectionRepo.update(id, {
    banner_image_url: asset.secureUrl,
    banner_public_id: asset.publicId,
  });

  await invalidate.invalidateCollections();

  return getCollection(id);
}

/**
 * Products carry `on delete restrict`, so a populated collection cannot be
 * dropped. Rather than surfacing a foreign-key error, the caller is told how
 * many pieces are in the way and offered deactivation instead.
 */
export async function deleteCollection(
  id: string,
  options: { reassignTo?: string } = {},
): Promise<{ deleted: boolean; movedProducts: number }> {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw ApiError.notFound("That collection no longer exists");

  const counts = await collectionRepo.countProductsByCollection(false);
  const productCount = counts.get(id) ?? 0;

  let moved = 0;

  if (productCount > 0) {
    if (!options.reassignTo) {
      throw ApiError.conflict(
        `This collection still holds ${productCount} ${
          productCount === 1 ? "product" : "products"
        }. Move them to another collection first, or deactivate this one instead.`,
        { productCount },
      );
    }

    if (options.reassignTo === id) {
      throw ApiError.badRequest("Choose a different collection to move the products into");
    }

    const target = await collectionRepo.findById(options.reassignTo);
    if (!target) throw ApiError.badRequest("The collection you chose does not exist");

    // Paged rather than capped: a collection holding more than one page of
    // products must still be emptied completely, or the delete below fails on
    // the foreign key with nothing explaining why.
    for (;;) {
      const affected = await collectionRepo.listAdminProductsIn(id, ADMIN_PAGE_BOUNDS.max);
      if (affected.length === 0) break;

      await Promise.all(
        affected.map((row) => productRepo.update(row.id, { collection_id: target.id })),
      );
      moved += affected.length;
    }
  }

  await collectionRepo.remove(id);
  if (existing.banner_public_id) await media.destroyImage(existing.banner_public_id);

  // Products may have been reassigned, so the whole catalogue is retired.
  await invalidate.invalidateCatalogue();

  return { deleted: true, movedProducts: moved };
}

/* ══ gallery ═══════════════════════════════════════════════ */

export type GalleryInput = {
  caption: string;
  category: GalleryCategory;
  span?: GallerySpan;
  sortOrder?: number;
  isActive?: boolean;
};

export async function listGallery(filter: {
  category?: GalleryCategory;
  isActive?: boolean;
}): Promise<GalleryItemRow[]> {
  return galleryRepo.listAdmin(filter);
}

export async function createGalleryItem(
  input: GalleryInput,
  file: UploadFile,
): Promise<GalleryItemRow> {
  const asset = await media.uploadImage(file, CLOUDINARY_FOLDERS.gallery);

  try {
    const created = await galleryRepo.insert({
      caption: input.caption.trim(),
      category: input.category,
      cloudinary_public_id: asset.publicId,
      secure_url: asset.secureUrl,
      width: asset.width,
      height: asset.height,
      span: input.span ?? "normal",
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    });

    await invalidate.invalidateGallery();

    return created;
  } catch (error) {
    await media.destroyImage(asset.publicId);
    throw error;
  }
}

export async function updateGalleryItem(
  id: string,
  input: Partial<GalleryInput>,
  file?: UploadFile,
): Promise<GalleryItemRow> {
  const existing = await galleryRepo.findById(id);
  if (!existing) throw ApiError.notFound("That gallery item no longer exists");

  let asset: Awaited<ReturnType<typeof media.uploadImage>> | null = null;
  if (file) asset = await media.uploadImage(file, CLOUDINARY_FOLDERS.gallery);

  const updated = await galleryRepo.update(id, {
    ...(input.caption !== undefined ? { caption: input.caption.trim() } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.span !== undefined ? { span: input.span } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    ...(asset
      ? {
          cloudinary_public_id: asset.publicId,
          secure_url: asset.secureUrl,
          width: asset.width,
          height: asset.height,
        }
      : {}),
  });

  // Only once the row points at the new asset is the old one safe to remove.
  if (asset && existing.cloudinary_public_id !== asset.publicId) {
    await media.destroyImage(existing.cloudinary_public_id);
  }

  // Covers a caption, a category move, a reorder, a deactivation and a
  // replaced photograph — the whole gallery family goes either way.
  await invalidate.invalidateGallery();

  return updated;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const existing = await galleryRepo.findById(id);
  if (!existing) throw ApiError.notFound("That gallery item no longer exists");

  await galleryRepo.remove(id);
  await media.destroyImage(existing.cloudinary_public_id);

  await invalidate.invalidateGallery();
}

export async function reorderGallery(items: { id: string; sortOrder: number }[]): Promise<void> {
  await Promise.all(
    items.map((item) => galleryRepo.update(item.id, { sort_order: item.sortOrder })),
  );
  await invalidate.invalidateGallery();
}

/* ══ site settings ═════════════════════════════════════════ */

export type SiteSettingsInput = {
  businessName?: string;
  legalName?: string | null;
  tagline?: string | null;
  shortDescription?: string | null;
  websiteUrl?: string | null;
  foundedYear?: string | null;
  phones?: string[];
  whatsappNumber?: string;
  email?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  street?: string | null;
  locality?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapsQuery?: string | null;
  hours?: BusinessHour[];
  hoursShort?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
};

export async function getSettings(): Promise<SiteSettingsRow> {
  const row = await settingsRepo.getAdmin();
  if (!row) throw ApiError.notFound("Site settings have not been seeded yet. Run `npm run seed`.");
  return row;
}

export async function updateSettings(input: SiteSettingsInput): Promise<SiteSettingsRow> {
  const existing = await getSettings();

  const updated = await settingsRepo.update(existing.id, {
    ...(input.businessName !== undefined ? { business_name: input.businessName.trim() } : {}),
    ...(input.legalName !== undefined ? { legal_name: input.legalName } : {}),
    ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
    ...(input.shortDescription !== undefined ? { short_description: input.shortDescription } : {}),
    ...(input.websiteUrl !== undefined ? { website_url: input.websiteUrl } : {}),
    ...(input.foundedYear !== undefined ? { founded_year: input.foundedYear } : {}),
    ...(input.phones !== undefined ? { phones: input.phones } : {}),
    ...(input.whatsappNumber !== undefined ? { whatsapp_number: input.whatsappNumber } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.instagramUrl !== undefined ? { instagram_url: input.instagramUrl } : {}),
    ...(input.facebookUrl !== undefined ? { facebook_url: input.facebookUrl } : {}),
    ...(input.youtubeUrl !== undefined ? { youtube_url: input.youtubeUrl } : {}),
    ...(input.street !== undefined ? { street: input.street } : {}),
    ...(input.locality !== undefined ? { locality: input.locality } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.region !== undefined ? { region: input.region } : {}),
    ...(input.postalCode !== undefined ? { postal_code: input.postalCode } : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
    ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    ...(input.mapsQuery !== undefined ? { maps_query: input.mapsQuery } : {}),
    ...(input.hours !== undefined ? { hours: input.hours } : {}),
    ...(input.hoursShort !== undefined ? { hours_short: input.hoursShort } : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.ratingCount !== undefined ? { rating_count: input.ratingCount } : {}),
  });

  // A new phone or WhatsApp number is on the public header at the next request.
  await invalidate.invalidateSiteSettings();

  return updated;
}

/* ══ dashboard ═════════════════════════════════════════════ */

/** Real counts only — nothing here is estimated or invented. */
export async function dashboard() {
  const [
    activeProducts,
    inactiveProducts,
    newArrivals,
    featuredProducts,
    galleryCount,
    collections,
    recentProducts,
  ] = await Promise.all([
    productRepo.countBy({ isActive: true }),
    productRepo.countBy({ isActive: false }),
    productRepo.countBy({ newArrival: true, isActive: true }),
    productRepo.countBy({ featured: true, isActive: true }),
    galleryRepo.count(true),
    listCollections(),
    productRepo.recentlyUpdated(6),
  ]);

  const productIndex = new Map(collections.map((row) => [row.id, row.name]));

  return {
    totals: {
      activeProducts,
      inactiveProducts,
      newArrivals,
      featuredProducts,
      galleryItems: galleryCount,
      collections: collections.length,
      activeCollections: collections.filter((row) => row.is_active).length,
    },
    recentProducts: recentProducts.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.is_active,
      updatedAt: row.updated_at,
      collectionName: productIndex.get(row.collection_id) ?? null,
    })),
    recentCollections: collections
      .slice()
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 5)
      .map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        productCount: row.productCount,
        isActive: row.is_active,
        updatedAt: row.updated_at,
      })),
  };
}
