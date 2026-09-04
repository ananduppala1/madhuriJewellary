-- ============================================================================
-- Row Level Security
--
-- Model: the Express API is the only writer. The anon key can read published
-- catalogue rows and nothing else — no writes anywhere, no access to
-- admin_users at all. Even if the anon key leaks (it is a browser-safe key by
-- design) the worst an attacker gains is the data the public website already
-- shows.
--
-- The service-role key bypasses RLS entirely and is used only by the API's
-- authenticated admin paths and by the seed script.
-- ============================================================================

alter table public.collections            enable row level security;
alter table public.collection_highlights  enable row level security;
alter table public.products               enable row level security;
alter table public.product_images         enable row level security;
alter table public.gallery_items          enable row level security;
alter table public.site_settings          enable row level security;
alter table public.admin_users            enable row level security;

alter table public.collections            force row level security;
alter table public.collection_highlights  force row level security;
alter table public.products               force row level security;
alter table public.product_images         force row level security;
alter table public.gallery_items          force row level security;
alter table public.site_settings          force row level security;
alter table public.admin_users            force row level security;

-- ── collections: active rows are public ────────────────────────────────────

drop policy if exists "collections_public_read" on public.collections;
create policy "collections_public_read"
  on public.collections
  for select
  to anon, authenticated
  using (is_active);

-- ── highlights: visible only with their parent collection ──────────────────

drop policy if exists "collection_highlights_public_read" on public.collection_highlights;
create policy "collection_highlights_public_read"
  on public.collection_highlights
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.collections c
      where c.id = collection_highlights.collection_id
        and c.is_active
    )
  );

-- ── products: active products inside active collections ────────────────────

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.collections c
      where c.id = products.collection_id
        and c.is_active
    )
  );

-- ── product images: follow their product ───────────────────────────────────

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read"
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      join public.collections c on c.id = p.collection_id
      where p.id = product_images.product_id
        and p.is_active
        and c.is_active
    )
  );

-- ── gallery: active items are public ───────────────────────────────────────

drop policy if exists "gallery_items_public_read" on public.gallery_items;
create policy "gallery_items_public_read"
  on public.gallery_items
  for select
  to anon, authenticated
  using (is_active);

-- ── site settings: public business information ─────────────────────────────
--
-- The public API projects a narrow column list on top of this; the row itself
-- holds nothing private.

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

-- ── admin_users: no policy, therefore no anon or authenticated access ──────
--
-- Deliberately left without any policy. With RLS enabled and no policy granted,
-- every statement from anon/authenticated is denied. Only the service role
-- (used server-side) can read or write this table.

-- ── writes ─────────────────────────────────────────────────────────────────
--
-- No insert/update/delete policy exists on any table above, so anon and
-- authenticated roles cannot mutate anything through the Supabase client.
-- All writes go through the Express admin API, which authenticates the caller
-- and then uses the service role.
