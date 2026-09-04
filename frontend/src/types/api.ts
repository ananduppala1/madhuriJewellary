/**
 * Shapes returned by the Madhuri Jewellers API. These mirror the backend's
 * public DTOs — the database row types are deliberately not reproduced here,
 * because the website never sees them.
 */

export type ProductBadge = "New" | "Best Seller" | "Bridal Pick" | "Limited" | "Made to Order";

export type GalleryCategory = "Store" | "Jewellery" | "Craft" | "Moments";

export type GallerySpan = "normal" | "wide" | "tall";

export type ProductImage = {
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  isPrimary: boolean;
};

export type CollectionRef = {
  slug: string;
  name: string;
  path: string;
};

export type Product = {
  slug: string;
  name: string;
  description: string;
  purity: string | null;
  weight: string | null;
  designs: string | null;
  badge: ProductBadge | null;
  isNewArrival: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  collection: CollectionRef | null;
};

export type ProductDetail = Product & {
  related: Product[];
};

export type CollectionSummary = {
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

export type Collection = CollectionSummary & {
  craftNote: string | null;
  highlights: { label: string; value: string }[];
  /** First page of products, shipped with the collection so the grid paints at once. */
  products: Product[];
  /** Paging metadata for `products` — `total` says whether more pages exist. */
  productPage: { page: number; limit: number; total: number };
  related: CollectionSummary[];
};

export type GalleryItem = {
  id: string;
  caption: string;
  category: GalleryCategory;
  span: GallerySpan;
  url: string;
  width: number | null;
  height: number | null;
};

export type BusinessHour = { days: string; time: string };

export type SiteSettings = {
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

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
