import { apiRequest, apiRequestWithMeta } from "./client";
import type {
  Admin,
  Collection,
  Dashboard,
  GalleryCategory,
  GalleryItem,
  GallerySpan,
  ListMeta,
  Product,
  ProductBadge,
  ProductImage,
  SiteSettings,
} from "@/types";

type Options = { signal?: AbortSignal };

/* ── auth ──────────────────────────────────────────────────── */

export const auth = {
  login: (email: string, password: string) =>
    apiRequest<{ admin: Admin }>("/auth/login", { method: "POST", body: { email, password } }),

  me: (options: Options = {}) =>
    apiRequest<{ admin: Admin }>("/auth/me", { ...options, skipRefresh: false }),

  logout: () => apiRequest<never>("/auth/logout", { method: "POST" }),
};

/* ── dashboard ─────────────────────────────────────────────── */

export const dashboard = {
  get: (options: Options = {}) => apiRequest<Dashboard>("/admin/dashboard", options),
};

/* ── products ──────────────────────────────────────────────── */

export type ProductFilters = {
  search?: string;
  collectionId?: string;
  badge?: ProductBadge | "";
  isActive?: boolean;
  newArrivals?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
};

export type ProductPayload = {
  name: string;
  slug?: string;
  description?: string;
  purity?: string | null;
  weight?: string | null;
  designs?: string | null;
  badge?: ProductBadge | null;
  collectionId?: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export const products = {
  async list(filters: ProductFilters = {}, options: Options = {}) {
    const { data, meta } = await apiRequestWithMeta<Product[]>("/admin/products", {
      ...options,
      query: {
        search: filters.search,
        collectionId: filters.collectionId,
        badge: filters.badge || undefined,
        isActive: filters.isActive,
        newArrivals: filters.newArrivals,
        featured: filters.featured,
        page: filters.page,
        limit: filters.limit,
      },
    });
    return { products: data, meta: meta as ListMeta };
  },

  get: (id: string, options: Options = {}) =>
    apiRequest<Product>(`/admin/products/${id}`, options),

  create: (payload: ProductPayload & { collectionId: string }) =>
    apiRequest<Product>("/admin/products", { method: "POST", body: payload }),

  update: (id: string, payload: ProductPayload) =>
    apiRequest<Product>(`/admin/products/${id}`, { method: "PATCH", body: payload }),

  remove: (id: string) => apiRequest<never>(`/admin/products/${id}`, { method: "DELETE" }),

  uploadImages(id: string, files: File[], altText?: string) {
    const form = new FormData();
    for (const file of files) form.append("images", file);
    if (altText) form.append("altText", altText);
    return apiRequest<ProductImage[]>(`/admin/products/${id}/images`, { method: "POST", form });
  },

  deleteImage: (id: string, imageId: string) =>
    apiRequest<never>(`/admin/products/${id}/images/${imageId}`, { method: "DELETE" }),

  setPrimaryImage: (id: string, imageId: string) =>
    apiRequest<ProductImage>(`/admin/products/${id}/images/${imageId}/primary`, {
      method: "PATCH",
    }),

  reorderImages: (id: string, order: string[]) =>
    apiRequest<ProductImage[]>(`/admin/products/${id}/images/order`, {
      method: "PATCH",
      body: { order },
    }),

  updateImageAlt: (id: string, imageId: string, altText: string) =>
    apiRequest<ProductImage>(`/admin/products/${id}/images/${imageId}`, {
      method: "PATCH",
      body: { altText },
    }),
};

/* ── collections ───────────────────────────────────────────── */

export type CollectionPayload = {
  name: string;
  slug?: string;
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

export const collections = {
  list: (options: Options = {}) => apiRequest<Collection[]>("/admin/collections", options),

  get: (id: string, options: Options = {}) =>
    apiRequest<Collection>(`/admin/collections/${id}`, options),

  create: (payload: CollectionPayload) =>
    apiRequest<Collection>("/admin/collections", { method: "POST", body: payload }),

  update: (id: string, payload: Partial<CollectionPayload>) =>
    apiRequest<Collection>(`/admin/collections/${id}`, { method: "PATCH", body: payload }),

  uploadBanner(id: string, file: File) {
    const form = new FormData();
    form.append("image", file);
    return apiRequest<Collection>(`/admin/collections/${id}/banner`, { method: "POST", form });
  },

  remove: (id: string, reassignTo?: string) =>
    apiRequest<{ deleted: boolean; movedProducts: number }>(`/admin/collections/${id}`, {
      method: "DELETE",
      query: reassignTo ? { reassignTo } : undefined,
    }),
};

/* ── gallery ───────────────────────────────────────────────── */

export type GalleryPayload = {
  caption: string;
  category: GalleryCategory;
  span?: GallerySpan;
  sortOrder?: number;
  isActive?: boolean;
};

export const gallery = {
  list: (
    filters: { category?: GalleryCategory; isActive?: boolean } = {},
    options: Options = {},
  ) =>
    apiRequest<GalleryItem[]>("/admin/gallery", {
      ...options,
      query: { category: filters.category, isActive: filters.isActive },
    }),

  create(payload: GalleryPayload, file: File) {
    const form = new FormData();
    form.append("image", file);
    form.append("caption", payload.caption);
    form.append("category", payload.category);
    if (payload.span) form.append("span", payload.span);
    if (payload.sortOrder !== undefined) form.append("sortOrder", String(payload.sortOrder));
    if (payload.isActive !== undefined) form.append("isActive", String(payload.isActive));
    return apiRequest<GalleryItem>("/admin/gallery", { method: "POST", form });
  },

  update(id: string, payload: Partial<GalleryPayload>, file?: File | null) {
    const form = new FormData();
    if (file) form.append("image", file);
    if (payload.caption !== undefined) form.append("caption", payload.caption);
    if (payload.category !== undefined) form.append("category", payload.category);
    if (payload.span !== undefined) form.append("span", payload.span);
    if (payload.sortOrder !== undefined) form.append("sortOrder", String(payload.sortOrder));
    if (payload.isActive !== undefined) form.append("isActive", String(payload.isActive));
    return apiRequest<GalleryItem>(`/admin/gallery/${id}`, { method: "PATCH", form });
  },

  remove: (id: string) => apiRequest<never>(`/admin/gallery/${id}`, { method: "DELETE" }),

  reorder: (items: { id: string; sortOrder: number }[]) =>
    apiRequest<never>("/admin/gallery/reorder", { method: "PATCH", body: { items } }),
};

/* ── site settings ─────────────────────────────────────────── */

export const siteSettings = {
  get: (options: Options = {}) => apiRequest<SiteSettings>("/admin/site-settings", options),

  update: (payload: Record<string, unknown>) =>
    apiRequest<SiteSettings>("/admin/site-settings", { method: "PATCH", body: payload }),
};
