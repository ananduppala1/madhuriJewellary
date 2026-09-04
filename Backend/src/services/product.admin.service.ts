import * as invalidate from "../cache/cache.invalidation.ts";
import * as collectionRepo from "../repositories/collection.repository.ts";
import * as productRepo from "../repositories/product.repository.ts";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.ts";
import { MAX_IMAGES_PER_PRODUCT } from "../constants/index.ts";
import type { ProductImageRow, ProductRow } from "../types/database.ts";
import { ApiError } from "../utils/ApiError.ts";
import { slugify } from "../utils/slug.ts";
import * as media from "./cloudinary.service.ts";

export type UploadFile = { buffer: Buffer; originalname: string };

/* ── shaping ───────────────────────────────────────────────── */

export type AdminProductDto = ProductRow & {
  collection: { id: string; name: string; slug: string; path: string } | null;
  images: ProductImageRow[];
};

async function attach(rows: ProductRow[]): Promise<AdminProductDto[]> {
  if (rows.length === 0) return [];

  const [collections, images] = await Promise.all([
    collectionRepo.listAll(),
    productRepo.imagesForProducts(
      rows.map((row) => row.id),
      "admin",
    ),
  ]);

  const index = new Map(collections.map((row) => [row.id, row]));

  return rows.map((row) => {
    const collection = index.get(row.collection_id);
    return {
      ...row,
      collection: collection
        ? {
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            path: collection.path,
          }
        : null,
      images: (images.get(row.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    };
  });
}

/* ── reads ─────────────────────────────────────────────────── */

export async function list(filter: productRepo.AdminProductFilter) {
  const result = await productRepo.listAdmin(filter);
  return {
    products: await attach(result.rows),
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
}

export async function get(id: string): Promise<AdminProductDto> {
  const row = await productRepo.findById(id);
  if (!row) throw ApiError.notFound("That product no longer exists");
  const [dto] = await attach([row]);
  if (!dto) throw ApiError.notFound("That product no longer exists");
  return dto;
}

/* ── writes ────────────────────────────────────────────────── */

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string;
  purity?: string | null;
  weight?: string | null;
  designs?: string | null;
  badge?: ProductRow["badge"];
  collectionId: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

async function assertCollectionExists(collectionId: string) {
  const collection = await collectionRepo.findById(collectionId);
  if (!collection) throw ApiError.badRequest("Pick a collection that exists");
  return collection;
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const existing = await productRepo.findBySlug(slug);
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict("Another product already uses that web address");
  }
}

export async function create(input: ProductInput): Promise<AdminProductDto> {
  await assertCollectionExists(input.collectionId);

  const slug = slugify(input.slug || input.name);
  if (!slug) throw ApiError.badRequest("The product name must contain letters or numbers");
  await assertSlugFree(slug);

  const row = await productRepo.insert({
    slug,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    purity: input.purity ?? null,
    weight: input.weight ?? null,
    designs: input.designs ?? null,
    badge: input.badge ?? null,
    collection_id: input.collectionId,
    is_new_arrival: input.isNewArrival ?? false,
    is_featured: input.isFeatured ?? false,
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 0,
  });

  // The row exists before anything is retired, so there is never a window in
  // which the cache is empty and the write has not landed.
  await invalidate.invalidateProduct({
    newArrival: row.is_new_arrival,
    featured: row.is_featured,
  });

  const [dto] = await attach([row]);
  return dto as AdminProductDto;
}

export async function update(
  id: string,
  input: Partial<ProductInput>,
): Promise<AdminProductDto> {
  const existing = await productRepo.findById(id);
  if (!existing) throw ApiError.notFound("That product no longer exists");

  if (input.collectionId) await assertCollectionExists(input.collectionId);

  const slug = input.slug ? slugify(input.slug) : undefined;
  if (slug) {
    if (!slug) throw ApiError.badRequest("That web address is not usable");
    await assertSlugFree(slug, id);
  }

  const row = await productRepo.update(id, {
    ...(slug ? { slug } : {}),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.purity !== undefined ? { purity: input.purity } : {}),
    ...(input.weight !== undefined ? { weight: input.weight } : {}),
    ...(input.designs !== undefined ? { designs: input.designs } : {}),
    ...(input.badge !== undefined ? { badge: input.badge } : {}),
    ...(input.collectionId !== undefined ? { collection_id: input.collectionId } : {}),
    ...(input.isNewArrival !== undefined ? { is_new_arrival: input.isNewArrival } : {}),
    ...(input.isFeatured !== undefined ? { is_featured: input.isFeatured } : {}),
    ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  });

  /**
   * Which lists this edit touches depends on what moved. A piece that was
   * featured and no longer is has to leave the featured cache as surely as one
   * that has just been marked featured, so both the old and the new value are
   * considered.
   */
  await invalidate.invalidateProduct({
    newArrival: existing.is_new_arrival || row.is_new_arrival,
    featured: existing.is_featured || row.is_featured,
  });

  const [dto] = await attach([row]);
  return dto as AdminProductDto;
}

/**
 * Deleting a product cascades its image rows in Postgres; the Cloudinary assets
 * are removed here so the media library does not fill with orphans.
 */
export async function remove(id: string): Promise<void> {
  const existing = await productRepo.findById(id);
  if (!existing) throw ApiError.notFound("That product no longer exists");

  const images = await productRepo.listImages(id);
  await productRepo.remove(id);
  await media.destroyMany(images.map((image) => image.cloudinary_public_id));

  await invalidate.invalidateProduct({
    newArrival: existing.is_new_arrival,
    featured: existing.is_featured,
  });
}

/** Reordering can change the first page of any list, so all of them go. */
export async function reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
  await Promise.all(
    items.map((item) => productRepo.update(item.id, { sort_order: item.sortOrder })),
  );
  await invalidate.invalidateCatalogue();
}

/* ── images ────────────────────────────────────────────────── */

export async function addImages(
  productId: string,
  files: UploadFile[],
  altText?: string,
): Promise<ProductImageRow[]> {
  const product = await productRepo.findById(productId);
  if (!product) throw ApiError.notFound("That product no longer exists");

  const existing = await productRepo.listImages(productId);
  if (existing.length + files.length > MAX_IMAGES_PER_PRODUCT) {
    throw ApiError.badRequest(
      `A product can hold up to ${MAX_IMAGES_PER_PRODUCT} images. Remove one first.`,
    );
  }

  const startOrder = existing.reduce((max, image) => Math.max(max, image.sort_order), -1) + 1;
  const created: ProductImageRow[] = [];

  for (const [index, file] of files.entries()) {
    const asset = await media.uploadImage(file, `${CLOUDINARY_FOLDERS.products}/${product.slug}`);

    try {
      created.push(
        await productRepo.insertImage({
          product_id: productId,
          cloudinary_public_id: asset.publicId,
          secure_url: asset.secureUrl,
          width: asset.width,
          height: asset.height,
          alt_text: altText?.trim() || `${product.name} at Madhuri Jewellers, Secunderabad`,
          sort_order: startOrder + index,
          // The very first image a product ever receives becomes its primary.
          is_primary: existing.length === 0 && index === 0,
        }),
      );
    } catch (error) {
      // The row failed, so the uploaded asset would be unreachable. Remove it.
      await media.destroyImage(asset.publicId);
      throw error;
    }
  }

  // Images are embedded in every product DTO — cards, detail page and the
  // related strip — so a new photograph retires the listings too.
  await invalidate.invalidateProductImages();

  return created;
}

export async function removeImage(productId: string, imageId: string): Promise<void> {
  const image = await productRepo.findImage(imageId);
  if (!image || image.product_id !== productId) {
    throw ApiError.notFound("That image is no longer attached to this product");
  }

  await productRepo.removeImage(imageId);
  await media.destroyImage(image.cloudinary_public_id);

  // Never leave a product with images but no primary.
  if (image.is_primary) {
    const remaining = await productRepo.listImages(productId);
    const next = remaining[0];
    if (next) await productRepo.updateImage(next.id, { is_primary: true });
  }

  await invalidate.invalidateProductImages();
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<ProductImageRow> {
  const image = await productRepo.findImage(imageId);
  if (!image || image.product_id !== productId) {
    throw ApiError.notFound("That image is no longer attached to this product");
  }

  // Clear first: the partial unique index allows only one primary per product.
  await productRepo.clearPrimary(productId);
  const updated = await productRepo.updateImage(imageId, { is_primary: true });

  // The primary image is the one every card leads with.
  await invalidate.invalidateProductImages();

  return updated;
}

export async function reorderImages(
  productId: string,
  order: string[],
): Promise<ProductImageRow[]> {
  const images = await productRepo.listImages(productId);
  const known = new Set(images.map((image) => image.id));

  if (order.length !== images.length || order.some((id) => !known.has(id))) {
    throw ApiError.badRequest("The new order must list every image on this product exactly once");
  }

  await Promise.all(
    order.map((id, index) => productRepo.updateImage(id, { sort_order: index })),
  );

  await invalidate.invalidateProductImages();

  return productRepo.listImages(productId);
}

export async function updateImageAlt(
  productId: string,
  imageId: string,
  altText: string,
): Promise<ProductImageRow> {
  const image = await productRepo.findImage(imageId);
  if (!image || image.product_id !== productId) {
    throw ApiError.notFound("That image is no longer attached to this product");
  }
  const updated = await productRepo.updateImage(imageId, {
    alt_text: altText.trim() || null,
  });

  await invalidate.invalidateProductImages();

  return updated;
}
