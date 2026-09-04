import type { Request, Response } from "express";
import * as admin from "../services/admin.service.ts";
import * as products from "../services/product.admin.service.ts";
import type { GalleryCategory, ProductBadge } from "../types/database.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { buildMeta, created, message, ok, okList } from "../utils/response.ts";

function files(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : [];
}

function requireFile(req: Request): Express.Multer.File {
  const file = req.file ?? files(req)[0];
  if (!file) throw ApiError.badRequest("Choose an image to upload");
  return file;
}

/* ── dashboard ─────────────────────────────────────────────── */

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await admin.dashboard());
});

/* ── products ──────────────────────────────────────────────── */

type AdminProductQuery = {
  collectionId?: string;
  badge?: ProductBadge;
  isActive?: boolean;
  newArrivals?: boolean;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as AdminProductQuery;

  const result = await products.list({
    ...(query.collectionId ? { collectionId: query.collectionId } : {}),
    ...(query.badge ? { badge: query.badge } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.newArrivals !== undefined ? { newArrivals: query.newArrivals } : {}),
    ...(query.featured !== undefined ? { featured: query.featured } : {}),
    ...(query.search ? { search: query.search } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  });

  return okList(res, result.products, buildMeta(result.page, result.limit, result.total));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await products.get(req.params.id as string));
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  return created(res, await products.create(req.body as products.ProductInput));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await products.update(req.params.id as string, req.body as products.ProductInput));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await products.remove(req.params.id as string);
  return message(res, "Product deleted");
});

export const reorderProducts = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; sortOrder: number }[] };
  await products.reorder(items);
  return message(res, "Order saved");
});

/* ── product images ────────────────────────────────────────── */

export const uploadProductImages = asyncHandler(async (req: Request, res: Response) => {
  const uploads = files(req);
  if (uploads.length === 0) throw ApiError.badRequest("Choose at least one image to upload");

  const body = req.body as { altText?: string };
  const images = await products.addImages(req.params.id as string, uploads, body.altText);

  return created(res, images);
});

export const deleteProductImage = asyncHandler(async (req: Request, res: Response) => {
  await products.removeImage(req.params.id as string, req.params.imageId as string);
  return message(res, "Image removed");
});

export const setPrimaryImage = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await products.setPrimaryImage(req.params.id as string, req.params.imageId as string));
});

export const reorderProductImages = asyncHandler(async (req: Request, res: Response) => {
  const { order } = req.body as { order: string[] };
  return ok(res, await products.reorderImages(req.params.id as string, order));
});

export const updateImageAlt = asyncHandler(async (req: Request, res: Response) => {
  const { altText } = req.body as { altText: string };
  return ok(
    res,
    await products.updateImageAlt(req.params.id as string, req.params.imageId as string, altText),
  );
});

/* ── collections ───────────────────────────────────────────── */

export const listCollections = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await admin.listCollections());
});

export const getCollection = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await admin.getCollection(req.params.id as string));
});

export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  return created(res, await admin.createCollection(req.body as admin.CollectionInput));
});

export const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  return ok(
    res,
    await admin.updateCollection(req.params.id as string, req.body as admin.CollectionInput),
  );
});

export const uploadCollectionBanner = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await admin.setCollectionBanner(req.params.id as string, requireFile(req)));
});

export const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const { reassignTo } = req.query as { reassignTo?: string };
  const result = await admin.deleteCollection(
    req.params.id as string,
    reassignTo ? { reassignTo } : {},
  );

  return ok(res, result);
});

/* ── gallery ───────────────────────────────────────────────── */

export const listGallery = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as { category?: GalleryCategory; isActive?: boolean };
  return ok(
    res,
    await admin.listGallery({
      ...(query.category ? { category: query.category } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    }),
  );
});

export const createGalleryItem = asyncHandler(async (req: Request, res: Response) => {
  return created(res, await admin.createGalleryItem(req.body as admin.GalleryInput, requireFile(req)));
});

export const updateGalleryItem = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file ?? files(req)[0];
  return ok(
    res,
    await admin.updateGalleryItem(
      req.params.id as string,
      req.body as admin.GalleryInput,
      file ?? undefined,
    ),
  );
});

export const deleteGalleryItem = asyncHandler(async (req: Request, res: Response) => {
  await admin.deleteGalleryItem(req.params.id as string);
  return message(res, "Gallery item deleted");
});

export const reorderGallery = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { id: string; sortOrder: number }[] };
  await admin.reorderGallery(items);
  return message(res, "Order saved");
});

/* ── site settings ─────────────────────────────────────────── */

export const getSiteSettings = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await admin.getSettings());
});

export const updateSiteSettings = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await admin.updateSettings(req.body as admin.SiteSettingsInput));
});
