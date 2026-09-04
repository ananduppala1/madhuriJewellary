import type {
  AdminRole,
  BusinessHour,
  GalleryCategory,
  GallerySpan,
  ProductBadge,
} from "./database.ts";

/* ── public shapes ─────────────────────────────────────────── */

export type PublicImage = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  isPrimary: boolean;
};

export type PublicProduct = {
  slug: string;
  name: string;
  description: string;
  purity: string | null;
  weight: string | null;
  designs: string | null;
  badge: ProductBadge | null;
  isNewArrival: boolean;
  isFeatured: boolean;
  images: PublicImage[];
  collection: { slug: string; name: string; path: string } | null;
};

export type PublicCollectionSummary = {
  slug: string;
  path: string;
  name: string;
  eyebrow: string;
  heroTitle: string;
  heroLine: string | null;
  intro: string | null;
  banner: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount?: number;
};

export type PublicCollection = PublicCollectionSummary & {
  craftNote: string | null;
  highlights: { label: string; value: string }[];
  /** First page of the collection's products, embedded so the grid paints at once. */
  products: PublicProduct[];
  /** Paging metadata for `products`, so the site knows whether more exist. */
  productPage: { page: number; limit: number; total: number };
};

/** A page of products plus the metadata the grid needs to page through them. */
export type PublicProductPage = {
  products: PublicProduct[];
  total: number;
  page: number;
  limit: number;
};

export type PublicGalleryItem = {
  id: string;
  caption: string;
  category: GalleryCategory;
  span: GallerySpan;
  url: string;
  width: number | null;
  height: number | null;
};

export type PublicSiteSettings = {
  name: string;
  legalName: string | null;
  tagline: string | null;
  shortDescription: string | null;
  url: string | null;
  founded: string | null;
  phones: string[];
  whatsapp: string;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  address: {
    street: string | null;
    locality: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  geo: { lat: number | null; lng: number | null };
  mapsQuery: string | null;
  hours: BusinessHour[];
  hoursShort: string | null;
  rating: number | null;
  ratingCount: number | null;
};

/* ── authentication ────────────────────────────────────────── */

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
      requestId?: string;
    }
  }
}
