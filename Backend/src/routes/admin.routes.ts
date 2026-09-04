import { Router } from "express";
import * as controller from "../controllers/admin.controller.ts";
import { authenticate, requireRole } from "../middlewares/auth.middleware.ts";
import { noStore } from "../middlewares/cache.middleware.ts";
import { adminWriteLimiter, uploadLimiter } from "../middlewares/rateLimit.middleware.ts";
import { uploadProductImages, uploadSingleImage } from "../middlewares/upload.middleware.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import {
  adminGalleryQuery,
  adminProductQuery,
  createCollectionSchema,
  createGallerySchema,
  createProductSchema,
  deleteCollectionQuery,
  idParam,
  imageAltSchema,
  imageOrderSchema,
  productImageParams,
  reorderSchema,
  updateCollectionSchema,
  updateGallerySchema,
  updateProductSchema,
  updateSiteSettingsSchema,
} from "../validators/index.ts";

/**
 * Everything below is gated twice — a valid Supabase session, then an active
 * row in admin_users. Route guards in the dashboard are a convenience; this is
 * the boundary that actually enforces access.
 */
export const adminRouter: Router = Router();

adminRouter.use(noStore);
adminRouter.use(authenticate);
adminRouter.use(requireRole("admin", "editor"));

adminRouter.get("/dashboard", controller.dashboard);

/* ── products ──────────────────────────────────────────────── */

adminRouter.get("/products", validate({ query: adminProductQuery }), controller.listProducts);

adminRouter.post(
  "/products",
  adminWriteLimiter,
  validate({ body: createProductSchema }),
  controller.createProduct,
);

adminRouter.patch(
  "/products/reorder",
  adminWriteLimiter,
  validate({ body: reorderSchema }),
  controller.reorderProducts,
);

adminRouter.get("/products/:id", validate({ params: idParam }), controller.getProduct);

adminRouter.patch(
  "/products/:id",
  adminWriteLimiter,
  validate({ params: idParam, body: updateProductSchema }),
  controller.updateProduct,
);

adminRouter.delete(
  "/products/:id",
  adminWriteLimiter,
  validate({ params: idParam }),
  controller.deleteProduct,
);

/* ── product images ────────────────────────────────────────── */

adminRouter.post(
  "/products/:id/images",
  uploadLimiter,
  validate({ params: idParam }),
  uploadProductImages,
  controller.uploadProductImages,
);

adminRouter.patch(
  "/products/:id/images/order",
  adminWriteLimiter,
  validate({ params: idParam, body: imageOrderSchema }),
  controller.reorderProductImages,
);

adminRouter.patch(
  "/products/:id/images/:imageId/primary",
  adminWriteLimiter,
  validate({ params: productImageParams }),
  controller.setPrimaryImage,
);

adminRouter.patch(
  "/products/:id/images/:imageId",
  adminWriteLimiter,
  validate({ params: productImageParams, body: imageAltSchema }),
  controller.updateImageAlt,
);

adminRouter.delete(
  "/products/:id/images/:imageId",
  adminWriteLimiter,
  validate({ params: productImageParams }),
  controller.deleteProductImage,
);

/* ── collections ───────────────────────────────────────────── */

adminRouter.get("/collections", controller.listCollections);

adminRouter.post(
  "/collections",
  adminWriteLimiter,
  validate({ body: createCollectionSchema }),
  controller.createCollection,
);

adminRouter.get("/collections/:id", validate({ params: idParam }), controller.getCollection);

adminRouter.patch(
  "/collections/:id",
  adminWriteLimiter,
  validate({ params: idParam, body: updateCollectionSchema }),
  controller.updateCollection,
);

adminRouter.post(
  "/collections/:id/banner",
  uploadLimiter,
  validate({ params: idParam }),
  uploadSingleImage,
  controller.uploadCollectionBanner,
);

adminRouter.delete(
  "/collections/:id",
  adminWriteLimiter,
  validate({ params: idParam, query: deleteCollectionQuery }),
  controller.deleteCollection,
);

/* ── gallery ───────────────────────────────────────────────── */

adminRouter.get("/gallery", validate({ query: adminGalleryQuery }), controller.listGallery);

adminRouter.post(
  "/gallery",
  uploadLimiter,
  uploadSingleImage,
  validate({ body: createGallerySchema }),
  controller.createGalleryItem,
);

adminRouter.patch(
  "/gallery/reorder",
  adminWriteLimiter,
  validate({ body: reorderSchema }),
  controller.reorderGallery,
);

adminRouter.patch(
  "/gallery/:id",
  uploadLimiter,
  validate({ params: idParam }),
  uploadSingleImage,
  validate({ body: updateGallerySchema }),
  controller.updateGalleryItem,
);

adminRouter.delete(
  "/gallery/:id",
  adminWriteLimiter,
  validate({ params: idParam }),
  controller.deleteGalleryItem,
);

/* ── site settings ─────────────────────────────────────────── */

adminRouter.get("/site-settings", controller.getSiteSettings);

adminRouter.patch(
  "/site-settings",
  adminWriteLimiter,
  validate({ body: updateSiteSettingsSchema }),
  controller.updateSiteSettings,
);
