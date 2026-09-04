import { Router } from "express";
import * as controller from "../controllers/public.controller.ts";
import { publicCache } from "../middlewares/cache.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  publicCollectionQuery,
  publicGalleryQuery,
  publicProductQuery,
  slugParam,
} from "../validators/index.ts";

/**
 * Read-only, unauthenticated, and served through the anon Supabase client so
 * Row Level Security still applies to every row that leaves here.
 *
 * `publicCache` sets HTTP cache headers for the browser and any CDN in front of
 * the API. It is a different mechanism from the Redis cache, which sits inside
 * the service layer below and is the authoritative application-level cache:
 * Redis is invalidated the moment an admin saves, whereas an HTTP cache can
 * only expire. Redis is what makes the origin fast; the header is a small bonus
 * on top and is deliberately kept short-lived.
 */
export const publicRouter: Router = Router();

publicRouter.use(publicCache);

publicRouter.get("/collections", controller.listCollections);
publicRouter.get(
  "/collections/:slug",
  validate({ params: slugParam, query: publicCollectionQuery }),
  controller.getCollection,
);

publicRouter.get("/products", validate({ query: publicProductQuery }), controller.listProducts);
publicRouter.get("/products/:slug", validate({ params: slugParam }), controller.getProduct);

publicRouter.get(
  "/new-arrivals",
  validate({ query: publicProductQuery }),
  controller.listNewArrivals,
);
publicRouter.get("/featured", validate({ query: publicProductQuery }), controller.listFeatured);

publicRouter.get("/gallery", validate({ query: publicGalleryQuery }), controller.listGallery);

publicRouter.get("/site-settings", controller.getSiteSettings);
