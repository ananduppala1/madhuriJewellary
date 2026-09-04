/**
 * Database types, kept in step with supabase/migrations by hand.
 *
 * Regenerating with `supabase gen types typescript` will produce an equivalent
 * file; this version is checked in so the project type-checks without a live
 * database connection.
 */

export type ProductBadge = "New" | "Best Seller" | "Bridal Pick" | "Limited" | "Made to Order";
export type GalleryCategory = "Store" | "Jewellery" | "Craft" | "Moments";
export type GallerySpan = "normal" | "wide" | "tall";
export type AdminRole = "admin" | "editor";

export type BusinessHour = { days: string; time: string };

export type CollectionRow = {
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
};

export type CollectionHighlightRow = {
  id: string;
  collection_id: string;
  label: string;
  value: string;
  sort_order: number;
};

export type ProductRow = {
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
};

export type ProductImageRow = {
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

export type GalleryItemRow = {
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

export type SiteSettingsRow = {
  id: string;
  singleton: boolean;
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
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Writable<Row, Required extends keyof Row> = Partial<Omit<Row, "id" | "created_at">> &
  Pick<Row, Required>;

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: CollectionRow;
        Insert: Writable<CollectionRow, "slug" | "path" | "name" | "hero_title"> & { id?: string };
        Update: Partial<CollectionRow>;
        Relationships: [];
      };
      collection_highlights: {
        Row: CollectionHighlightRow;
        Insert: Writable<CollectionHighlightRow, "collection_id" | "label" | "value"> & {
          id?: string;
        };
        Update: Partial<CollectionHighlightRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Writable<ProductRow, "slug" | "name" | "collection_id"> & { id?: string };
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      product_images: {
        Row: ProductImageRow;
        Insert: Writable<
          ProductImageRow,
          "product_id" | "cloudinary_public_id" | "secure_url"
        > & { id?: string };
        Update: Partial<ProductImageRow>;
        Relationships: [];
      };
      gallery_items: {
        Row: GalleryItemRow;
        Insert: Writable<
          GalleryItemRow,
          "caption" | "category" | "cloudinary_public_id" | "secure_url"
        > & { id?: string };
        Update: Partial<GalleryItemRow>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingsRow;
        Insert: Writable<SiteSettingsRow, "business_name" | "whatsapp_number"> & { id?: string };
        Update: Partial<SiteSettingsRow>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Writable<AdminUserRow, "email"> & { id: string };
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_badge: ProductBadge;
      gallery_category: GalleryCategory;
      gallery_span: GallerySpan;
      admin_role: AdminRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
