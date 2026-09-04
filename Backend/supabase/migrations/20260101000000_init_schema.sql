-- ============================================================================
-- Madhuri Jewellers — initial schema
--
-- Normalised catalogue: collections own products, products own an ordered list
-- of Cloudinary images. Nothing binary is stored here; only Cloudinary metadata.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── enums ──────────────────────────────────────────────────────────────────

do $$ begin
  create type product_badge as enum ('New', 'Best Seller', 'Bridal Pick', 'Limited', 'Made to Order');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gallery_category as enum ('Store', 'Jewellery', 'Craft', 'Moments');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gallery_span as enum ('normal', 'wide', 'tall');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

-- ── updated_at trigger ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── collections ────────────────────────────────────────────────────────────

create table if not exists public.collections (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null,
  path              text not null,
  name              text not null,
  eyebrow           text not null default '',
  hero_title        text not null,
  hero_line         text,
  intro             text,
  banner_image_url  text,
  banner_public_id  text,
  seo_title         text,
  seo_description   text,
  craft_note        text,
  sort_order        integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint collections_slug_key unique (slug),
  constraint collections_path_key unique (path),
  constraint collections_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint collections_path_format check (path ~ '^/[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint collections_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists collections_active_sort_idx
  on public.collections (is_active, sort_order, name);

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

-- ── collection_highlights ──────────────────────────────────────────────────

create table if not exists public.collection_highlights (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null references public.collections (id) on delete cascade,
  label          text not null,
  value          text not null,
  sort_order     integer not null default 0,

  constraint collection_highlights_label_not_blank check (length(btrim(label)) > 0),
  constraint collection_highlights_unique_label unique (collection_id, label)
);

create index if not exists collection_highlights_collection_idx
  on public.collection_highlights (collection_id, sort_order);

-- ── products ───────────────────────────────────────────────────────────────
--
-- on delete restrict: a collection holding products cannot be dropped by
-- accident. The admin API deactivates or requires reassignment instead.

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  name            text not null,
  description     text not null default '',
  purity          text,
  weight          text,
  designs         text,
  badge           product_badge,
  collection_id   uuid not null references public.collections (id) on delete restrict,
  is_new_arrival  boolean not null default false,
  is_featured     boolean not null default false,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint products_slug_key unique (slug),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_name_not_blank check (length(btrim(name)) > 0)
);

create index if not exists products_collection_idx
  on public.products (collection_id, sort_order, name);
create index if not exists products_active_idx
  on public.products (is_active) where is_active;
create index if not exists products_new_arrival_idx
  on public.products (is_new_arrival, sort_order) where is_new_arrival;
create index if not exists products_featured_idx
  on public.products (is_featured, sort_order) where is_featured;
create index if not exists products_badge_idx
  on public.products (badge);
create index if not exists products_updated_at_idx
  on public.products (updated_at desc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ── product_images ─────────────────────────────────────────────────────────
--
-- A product may carry any number of images. The partial unique index lets
-- exactly one of them be the primary.

create table if not exists public.product_images (
  id                    uuid primary key default gen_random_uuid(),
  product_id            uuid not null references public.products (id) on delete cascade,
  cloudinary_public_id  text not null,
  secure_url            text not null,
  width                 integer,
  height                integer,
  alt_text              text,
  sort_order            integer not null default 0,
  is_primary            boolean not null default false,
  created_at            timestamptz not null default now(),

  constraint product_images_unique_asset unique (product_id, cloudinary_public_id),
  constraint product_images_url_is_https check (secure_url like 'https://%')
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, sort_order);

create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

-- ── gallery_items ──────────────────────────────────────────────────────────

create table if not exists public.gallery_items (
  id                    uuid primary key default gen_random_uuid(),
  caption               text not null,
  category              gallery_category not null,
  cloudinary_public_id  text not null,
  secure_url            text not null,
  width                 integer,
  height                integer,
  span                  gallery_span not null default 'normal',
  seed_key              text,
  sort_order            integer not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint gallery_items_seed_key_key unique (seed_key),
  constraint gallery_items_caption_not_blank check (length(btrim(caption)) > 0),
  constraint gallery_items_url_is_https check (secure_url like 'https://%')
);

create index if not exists gallery_items_active_idx
  on public.gallery_items (is_active, sort_order);
create index if not exists gallery_items_category_idx
  on public.gallery_items (category, sort_order);

drop trigger if exists gallery_items_set_updated_at on public.gallery_items;
create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();

-- ── site_settings ──────────────────────────────────────────────────────────
--
-- Single row, enforced by a unique constant column rather than by convention.

create table if not exists public.site_settings (
  id                 uuid primary key default gen_random_uuid(),
  singleton          boolean not null default true,
  business_name      text not null,
  legal_name         text,
  tagline            text,
  short_description  text,
  website_url        text,
  founded_year       text,
  phones             text[] not null default '{}',
  whatsapp_number    text not null,
  email              text,
  instagram_url      text,
  facebook_url       text,
  youtube_url        text,
  street             text,
  locality           text,
  city               text,
  region             text,
  postal_code        text,
  country            text,
  latitude           double precision,
  longitude          double precision,
  maps_query         text,
  hours              jsonb not null default '[]'::jsonb,
  hours_short        text,
  rating             numeric(2, 1),
  rating_count       integer,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint site_settings_singleton_key unique (singleton),
  constraint site_settings_singleton_true check (singleton),
  constraint site_settings_hours_is_array check (jsonb_typeof(hours) = 'array'),
  constraint site_settings_whatsapp_digits check (whatsapp_number ~ '^[0-9]{8,15}$'),
  constraint site_settings_rating_range check (rating is null or (rating >= 0 and rating <= 5))
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ── admin_users ────────────────────────────────────────────────────────────
--
-- Authorisation profile hung off Supabase Auth. Passwords live in auth.users
-- and are never mirrored here.

create table if not exists public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        admin_role not null default 'admin',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint admin_users_email_key unique (email)
);

create index if not exists admin_users_active_idx
  on public.admin_users (is_active) where is_active;

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();
