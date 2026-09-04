-- ============================================================================
-- Public read path indexes
--
-- Added alongside the Redis cache rather than instead of it: the cache removes
-- repeated work, an index makes the work that does happen cheap. Every cache
-- miss, every invalidation and every cold start still lands on these queries.
--
-- Each index below matches a query this API actually issues. Nothing is added
-- speculatively — an unused index costs write throughput on every admin save
-- and buys nothing.
-- ============================================================================

-- ── products: the public listing ───────────────────────────────────────────
--
-- product.repository.listPublic() orders by (sort_order, name) and RLS adds
-- `is_active`. The existing products_active_idx covers only the predicate, so
-- Postgres still had to sort the matching rows. A partial index carrying the
-- sort keys answers the ordering from the index itself.

create index if not exists products_public_sort_idx
  on public.products (sort_order, name)
  where is_active;

-- ── products: new arrivals and featured ────────────────────────────────────
--
-- The existing partial indexes key on the flag alone, so a page of new
-- arrivals still sorted afterwards. These carry the ordering and fold in
-- is_active, which RLS applies to every public read.

drop index if exists public.products_new_arrival_idx;
create index if not exists products_new_arrival_sort_idx
  on public.products (sort_order, name)
  where is_new_arrival and is_active;

drop index if exists public.products_featured_idx;
create index if not exists products_featured_sort_idx
  on public.products (sort_order, name)
  where is_featured and is_active;

-- ── products: a collection page ────────────────────────────────────────────
--
-- products_collection_idx already covers (collection_id, sort_order, name).
-- Restricting a second copy to active rows keeps the collection pages — the
-- most requested listing on the site — off the inactive rows entirely.

create index if not exists products_collection_active_idx
  on public.products (collection_id, sort_order, name)
  where is_active;

-- ── product images: the batch fetch ────────────────────────────────────────
--
-- imagesForProducts() fetches one page of products' images in a single
-- `in (...)` query ordered by (is_primary desc, sort_order). Adding is_primary
-- to the existing index lets that ordering come from the index.

create index if not exists product_images_product_primary_idx
  on public.product_images (product_id, is_primary desc, sort_order);

-- ── gallery: the public grid, filtered by category ─────────────────────────
--
-- gallery.listPublic() filters on category (optionally) and orders by
-- (sort_order, created_at) over active rows only.

create index if not exists gallery_public_sort_idx
  on public.gallery_items (category, sort_order, created_at)
  where is_active;

-- ── collections: slug and path lookup ──────────────────────────────────────
--
-- `slug` and `path` are already unique, so those lookups are indexed. What was
-- missing is the active-only ordering used by the collection list, which backs
-- the header menu, the home grid and every product DTO's collection reference.

create index if not exists collections_public_sort_idx
  on public.collections (sort_order, name)
  where is_active;

-- ── site settings ──────────────────────────────────────────────────────────
--
-- One row, reached through a unique constraint on `singleton`. No index needed
-- and none added — noted here so the omission reads as deliberate.
