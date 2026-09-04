import { z } from "zod";
import {
  ADMIN_ROLES,
  GALLERY_CATEGORIES,
  GALLERY_SPANS,
  PRODUCT_BADGES,
} from "../constants/index.js";
import { ADMIN_PAGE_BOUNDS, PUBLIC_PAGE_BOUNDS } from "../utils/pagination.js";

/**
 * `.strict()` everywhere on write bodies: an unexpected key is an error rather
 * than something quietly stripped, which is what keeps an admin client from
 * probing for columns it should not be able to set.
 */

export const uuid = z.string().uuid("That identifier is not valid");

export const idParam = z.object({ id: uuid });

export const slugParam = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "That web address is not valid"),
});

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value));

const boolish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) =>
    typeof value === "boolean" ? value : value === "true" || value === "1",
  );

const numeric = z.coerce.number();

/* ── shared query shapes ───────────────────────────────────── */

/**
 * The public ceiling is deliberately lower than the dashboard's. It stops
 * `?limit=10000` from pulling an entire catalogue into one response — and, now
 * that responses are cached, from landing in Redis as a single enormous entry
 * that every other page has to compete with for memory.
 */
export const publicPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(PUBLIC_PAGE_BOUNDS.max).optional(),
});

export const adminPaginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(ADMIN_PAGE_BOUNDS.max).optional(),
});

/** Kept as the admin shape, which is what the existing admin schemas extend. */
export const paginationQuery = adminPaginationQuery;

/* ── auth ──────────────────────────────────────────────────── */

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z.string().min(1, "Enter your password").max(200),
  })
  .strict();

/* ── public queries ────────────────────────────────────────── */

export const publicProductQuery = publicPaginationQuery.extend({
  collection: z.string().trim().max(120).optional(),
  badge: z.enum(PRODUCT_BADGES).optional(),
  newArrivals: boolish.optional(),
  featured: boolish.optional(),
  search: z.string().trim().max(100).optional(),
});

export const publicGalleryQuery = z.object({
  category: z.enum(GALLERY_CATEGORIES).optional(),
});

/** The collection page ships its first page of products with the hero. */
export const publicCollectionQuery = publicPaginationQuery;

/* ── admin: products ───────────────────────────────────────── */

export const adminProductQuery = adminPaginationQuery.extend({
  collectionId: uuid.optional(),
  badge: z.enum(PRODUCT_BADGES).optional(),
  isActive: boolish.optional(),
  newArrivals: boolish.optional(),
  featured: boolish.optional(),
  search: z.string().trim().max(100).optional(),
});

const productFields = {
  name: trimmed(160).min(2, "Give the piece a name"),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/i, "Use letters, numbers and hyphens only")
    .optional(),
  description: trimmed(2000).optional(),
  purity: optionalText(120),
  weight: optionalText(120),
  designs: optionalText(120),
  badge: z.union([z.enum(PRODUCT_BADGES), z.null()]).optional(),
  collectionId: uuid,
  isNewArrival: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
};

export const createProductSchema = z.object(productFields).strict();

export const updateProductSchema = z
  .object({ ...productFields, name: productFields.name.optional(), collectionId: uuid.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const reorderSchema = z
  .object({
    items: z
      .array(z.object({ id: uuid, sortOrder: z.number().int().min(0).max(10_000) }).strict())
      .min(1)
      .max(200),
  })
  .strict();

export const imageOrderSchema = z.object({ order: z.array(uuid).min(1).max(24) }).strict();

export const imageAltSchema = z.object({ altText: trimmed(300) }).strict();

export const productImageParams = z.object({ id: uuid, imageId: uuid });

/* ── admin: collections ────────────────────────────────────── */

const highlightSchema = z
  .object({ label: trimmed(80).min(1), value: trimmed(200).min(1) })
  .strict();

const collectionFields = {
  name: trimmed(120).min(2, "Give the collection a name"),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/i, "Use letters, numbers and hyphens only")
    .optional(),
  path: z.string().trim().max(120).optional(),
  eyebrow: trimmed(80).optional(),
  heroTitle: trimmed(160).optional(),
  heroLine: optionalText(300),
  intro: optionalText(2000),
  seoTitle: optionalText(200),
  seoDescription: optionalText(400),
  craftNote: optionalText(1000),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
  highlights: z.array(highlightSchema).max(8).optional(),
};

export const createCollectionSchema = z.object(collectionFields).strict();

export const updateCollectionSchema = z
  .object({ ...collectionFields, name: collectionFields.name.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const deleteCollectionQuery = z.object({ reassignTo: uuid.optional() });

/* ── admin: gallery ────────────────────────────────────────── */

export const adminGalleryQuery = z.object({
  category: z.enum(GALLERY_CATEGORIES).optional(),
  isActive: boolish.optional(),
});

/**
 * Gallery writes arrive as multipart/form-data alongside the file, so every
 * scalar shows up as a string and is coerced here.
 */
export const createGallerySchema = z
  .object({
    caption: trimmed(200).min(2, "Add a caption"),
    category: z.enum(GALLERY_CATEGORIES),
    span: z.enum(GALLERY_SPANS).optional(),
    sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
    isActive: boolish.optional(),
  })
  .strict();

export const updateGallerySchema = z
  .object({
    caption: trimmed(200).min(2).optional(),
    category: z.enum(GALLERY_CATEGORIES).optional(),
    span: z.enum(GALLERY_SPANS).optional(),
    sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
    isActive: boolish.optional(),
  })
  .strict();

/* ── admin: site settings ──────────────────────────────────── */

const phone = z
  .string()
  .trim()
  .regex(/^[0-9]{6,15}$/, "Phone numbers must be 6–15 digits, without spaces");

const optionalUrl = z
  .union([z.string().trim().url("Enter a full URL including https://"), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" ? null : value));

export const updateSiteSettingsSchema = z
  .object({
    businessName: trimmed(120).min(2).optional(),
    legalName: optionalText(120),
    tagline: optionalText(200),
    shortDescription: optionalText(400),
    websiteUrl: optionalUrl,
    foundedYear: optionalText(10),
    phones: z.array(phone).max(5).optional(),
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{8,15}$/, "Include the country code, digits only — for example 919440964379")
      .optional(),
    email: z
      .union([z.string().trim().email("Enter a valid email address"), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value === "" ? null : value)),
    instagramUrl: optionalUrl,
    facebookUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    street: optionalText(200),
    locality: optionalText(120),
    city: optionalText(120),
    region: optionalText(120),
    postalCode: optionalText(20),
    country: optionalText(60),
    latitude: z.union([numeric.min(-90).max(90), z.null()]).optional(),
    longitude: z.union([numeric.min(-180).max(180), z.null()]).optional(),
    mapsQuery: optionalText(300),
    hours: z
      .array(z.object({ days: trimmed(60).min(1), time: trimmed(60).min(1) }).strict())
      .max(7)
      .optional(),
    hoursShort: optionalText(120),
    rating: z.union([numeric.min(0).max(5), z.null()]).optional(),
    ratingCount: z.union([z.coerce.number().int().min(0).max(1_000_000), z.null()]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const roleSchema = z.enum(ADMIN_ROLES);
