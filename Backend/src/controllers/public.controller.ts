import type { Request, Response } from "express";
import * as catalogue from "../services/catalogue.service.ts";
import * as publicService from "../services/public.service.ts";
import type { GalleryCategory, ProductBadge } from "../types/database.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { buildMeta, ok, okList } from "../utils/response.ts";

/**
 * Controllers stayed thin. Caching happens a layer down, in the services, so
 * nothing here knows or cares whether a response came from Redis or Supabase.
 */

type ProductQuery = {
  collection?: string;
  badge?: ProductBadge;
  newArrivals?: boolean;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export const listCollections = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await catalogue.listCollections());
});

export const getCollection = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const { page, limit } = req.query as { page?: number; limit?: number };

  const collection = await catalogue.getCollection(slug, { page, limit });
  const related = await catalogue.listRelatedCollections(collection.path, 3);

  return ok(res, { ...collection, related });
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as ProductQuery;
  const result = await catalogue.listProducts(query);
  return okList(res, result.products, buildMeta(result.page, result.limit, result.total));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params as { slug: string };
  const [product, related] = await Promise.all([
    catalogue.getProduct(slug),
    catalogue.relatedProducts(slug, 4),
  ]);
  return ok(res, { ...product, related });
});

export const listNewArrivals = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as ProductQuery;
  const result = await catalogue.listProducts({ ...query, newArrivals: true });
  return okList(res, result.products, buildMeta(result.page, result.limit, result.total));
});

export const listFeatured = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as ProductQuery;
  const result = await catalogue.listProducts({ ...query, featured: true });
  return okList(res, result.products, buildMeta(result.page, result.limit, result.total));
});

export const listGallery = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query as { category?: GalleryCategory };
  return ok(res, await publicService.listGallery(category));
});

export const getSiteSettings = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await publicService.getSiteSettings());
});
