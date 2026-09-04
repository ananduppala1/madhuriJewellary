export type ProductBadge = "New" | "Best Seller" | "Bridal Pick" | "Limited" | "Made to Order";
export type GalleryCategory = "Store" | "Jewellery" | "Craft" | "Moments";
export type GallerySpan = "normal" | "wide" | "tall";
export type AdminRole = "admin" | "editor";

export const PRODUCT_BADGES: ProductBadge[] = [
  "New",
  "Best Seller",
  "Bridal Pick",
  "Limited",
  "Made to Order",
];

export const GALLERY_CATEGORIES: GalleryCategory[] = ["Store", "Jewellery", "Craft", "Moments"];

export const GALLERY_SPANS: GallerySpan[] = ["normal", "wide", "tall"];

export type Admin = {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
};

export type ProductImage = {
  id: string;
  product_id: string;
  cloudinary_public_id: string;
  secure_url: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  purity: string | null;
  weight: string | null;
  designs: string | null;
  badge: ProductBadge | null;
  collection_id: string;
  is_new_arrival: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  collection: { id: string; name: string; slug: string; path: string } | null;
  images: ProductImage[];
};

export type CollectionHighlight = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type Collection = {
  id: string;
  slug: string;
  path: string;
  name: string;
  eyebrow: string;
  hero_title: string;
  hero_line: string | null;
  intro: string | null;
  banner_image_url: string | null;
  banner_public_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  craft_note: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  highlights: CollectionHighlight[];
  productCount: number;
};

export type GalleryItem = {
  id: string;
  caption: string;
  category: GalleryCategory;
  cloudinary_public_id: string;
  secure_url: string;
  width: number | null;
  height: number | null;
  span: GallerySpan;
  seed_key: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessHour = { days: string; time: string };

export type SiteSettings = {
  id: string;
  business_name: string;
  legal_name: string | null;
  tagline: string | null;
  short_description: string | null;
  website_url: string | null;
  founded_year: string | null;
  phones: string[];
  whatsapp_number: string;
  email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  street: string | null;
  locality: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  maps_query: string | null;
  hours: BusinessHour[];
  hours_short: string | null;
  rating: number | null;
  rating_count: number | null;
  updated_at: string;
};

export type Dashboard = {
  totals: {
    activeProducts: number;
    inactiveProducts: number;
    newArrivals: number;
    featuredProducts: number;
    galleryItems: number;
    collections: number;
    activeCollections: number;
  };
  recentProducts: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    updatedAt: string;
    collectionName: string | null;
  }[];
  recentCollections: {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    isActive: boolean;
    updatedAt: string;
  }[];
};

export type ListMeta = { page: number; limit: number; total: number; totalPages: number };
