import { cacheKeys, getOrSet } from "../cache/index.js";
import * as collectionRepo from "../repositories/collection.repository.js";
import * as productRepo from "../repositories/product.repository.js";
import type {
  PublicCollection,
  PublicCollectionSummary,
  PublicImage,
  PublicProduct,
  PublicProductPage,
} from "../types/api.js";
import type { ProductBadge, ProductImageRow } from "../types/database.js";
import { ApiError } from "../utils/ApiError.js";
import { resolvePaging } from "../utils/pagination.js";

/**
 * The public site sees a hand-built projection, never a database row. Internal
 * ids, activity flags, Cloudinary public_ids and timestamps stop here.
 *
 * Caching also lives at this boundary rather than in a middleware or a
 * repository. The value written to Redis is the finished DTO the controller is
 * about to serialise, which means a cache hit and a database read are the same
 * bytes — a client cannot tell which one it got — and invalidation reasons
 * about API responses rather than about rows.
 */

type CollectionLike = collectionRepo.PublicCollectionRow;
type ProductLike = productRepo.PublicProductRow;

function toImage(row: ProductImageRow): PublicImage {
  return {
    url: row.secure_url,
    width: row.width,
    height: row.height,
    alt: row.alt_text,
    isPrimary: row.is_primary,
  };
}

function toProduct(
  row: ProductLike,
  images: ProductImageRow[],
  collection: CollectionLike | undefined,
): PublicProduct {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    purity: row.purity,
    weight: row.weight,
    designs: row.designs,
    badge: row.badge,
    isNewArrival: row.is_new_arrival,
    isFeatured: row.is_featured,
    images: images.map(toImage),
    collection: collection
      ? { slug: collection.slug, name: collection.name, path: collection.path }
      : null,
  };
}

function toCollectionSummary(row: CollectionLike, productCount?: number): PublicCollectionSummary {
  return {
    slug: row.slug,
    path: row.path,
    name: row.name,
    eyebrow: row.eyebrow,
    heroTitle: row.hero_title,
    heroLine: row.hero_line,
    intro: row.intro,
    banner: row.banner_image_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ...(productCount === undefined ? {} : { productCount }),
  };
}

/** Attach images to a page of products with a single extra query. */
async function decorate(
  rows: ProductLike[],
  collections: Map<string, CollectionLike>,
): Promise<PublicProduct[]> {
  const images = await productRepo.imagesForProducts(
    rows.map((row) => row.id),
    "public",
  );
  return rows.map((row) =>
    toProduct(row, images.get(row.id) ?? [], collections.get(row.collection_id)),
  );
}

async function collectionIndex(): Promise<Map<string, CollectionLike>> {
  const rows = await collectionRepo.listPublic();
  return new Map(rows.map((row) => [row.id, row]));
}

/* ── collections ───────────────────────────────────────────── */

export async function listCollections(): Promise<PublicCollectionSummary[]> {
  return getOrSet<PublicCollectionSummary[]>(
    cacheKeys.collectionsKey(),
    async () => {
      const [rows, counts] = await Promise.all([
        collectionRepo.listPublic(),
        collectionRepo.countProductsByCollection(true),
      ]);

      return rows.map((row) => toCollectionSummary(row, counts.get(row.id) ?? 0));
    },
    "public collection list",
  );
}

/**
 * The collection page ships its first page of products with the hero, so the
 * grid paints in one request. Further pages come from `/products?collection=`,
 * which shares the same cache family and the same product DTO.
 */
export async function getCollection(
  identifier: string,
  paging: { page?: number | undefined; limit?: number | undefined } = {},
): Promise<PublicCollection> {
  const { page, limit } = resolvePaging(paging.page, paging.limit);

  return getOrSet<PublicCollection>(
    cacheKeys.collectionKey(identifier, page, limit),
    async () => {
      const row = await collectionRepo.findPublicBySlugOrPath(identifier);
      if (!row) throw ApiError.notFound("That collection is not available");

      const [highlights, products] = await Promise.all([
        collectionRepo.listHighlights([row.id]),
        productRepo.listPublic({ collectionIds: [row.id], page, limit }),
      ]);

      const index = new Map<string, CollectionLike>([[row.id, row]]);
      const decorated = await decorate(products.rows, index);

      return {
        ...toCollectionSummary(row, products.total),
        craftNote: row.craft_note,
        highlights: highlights.map((item) => ({ label: item.label, value: item.value })),
        products: decorated,
        productPage: { page: products.page, limit: products.limit, total: products.total },
      };
    },
    "public collection detail",
  );
}

/** Everything the "related collections" strip needs. */
export async function listRelatedCollections(
  excludePath: string,
  limit = 3,
): Promise<PublicCollectionSummary[]> {
  return getOrSet<PublicCollectionSummary[]>(
    cacheKeys.relatedCollectionsKey(excludePath, limit),
    async () => {
      const rows = await collectionRepo.listPublic();
      return rows
        .filter((row) => row.path !== excludePath)
        .slice(0, limit)
        .map((row) => toCollectionSummary(row));
    },
    "public related collections",
  );
}

/* ── products ──────────────────────────────────────────────── */

export type ProductQuery = {
  collection?: string | undefined;
  badge?: ProductBadge | undefined;
  newArrivals?: boolean | undefined;
  featured?: boolean | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
};

export async function listProducts(query: ProductQuery): Promise<PublicProductPage> {
  const { page, limit } = resolvePaging(query.page, query.limit);
  const collection = cacheKeys.normaliseCollection(query.collection);

  return getOrSet<PublicProductPage>(
    cacheKeys.productListKey({
      collection,
      badge: query.badge,
      newArrivals: query.newArrivals,
      featured: query.featured,
      search: query.search,
      page,
      limit,
    }),
    async () => {
      const collections = await collectionIndex();

      let collectionIds: string[] | undefined;
      if (collection) {
        const match = [...collections.values()].find(
          (row) => row.slug === collection || row.path === `/${collection}`,
        );
        if (!match) throw ApiError.notFound("That collection is not available");
        collectionIds = [match.id];
      }

      const result = await productRepo.listPublic({
        ...(collectionIds ? { collectionIds } : {}),
        ...(query.badge ? { badge: query.badge } : {}),
        ...(query.newArrivals ? { newArrivals: true } : {}),
        ...(query.featured ? { featured: true } : {}),
        ...(query.search ? { search: query.search } : {}),
        page,
        limit,
      });

      return {
        products: await decorate(result.rows, collections),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    },
    "public product list",
  );
}

export async function getProduct(slug: string): Promise<PublicProduct> {
  return getOrSet<PublicProduct>(
    cacheKeys.productKey(slug),
    async () => {
      const row = await productRepo.findPublicBySlug(slug);
      if (!row) throw ApiError.notFound("That piece is not on the website");

      const [images, collections] = await Promise.all([
        productRepo.imagesForProducts([row.id], "public"),
        collectionIndex(),
      ]);

      return toProduct(row, images.get(row.id) ?? [], collections.get(row.collection_id));
    },
    "public product detail",
  );
}

/**
 * Products shown alongside a piece on its detail page — same collection first,
 * excluding the piece itself.
 */
export async function relatedProducts(slug: string, limit = 4): Promise<PublicProduct[]> {
  return getOrSet<PublicProduct[]>(
    cacheKeys.relatedProductsKey(slug, limit),
    async () => {
      const row = await productRepo.findPublicBySlug(slug);
      if (!row) return [];

      const collections = await collectionIndex();
      const siblings = await productRepo.listPublic({
        collectionIds: [row.collection_id],
        limit: limit + 1,
      });

      return decorate(
        siblings.rows.filter((item) => item.slug !== slug).slice(0, limit),
        collections,
      );
    },
    "public related products",
  );
}

export async function newArrivals(limit?: number): Promise<PublicProductPage> {
  return listProducts({ newArrivals: true, limit });
}

export async function featured(limit?: number): Promise<PublicProductPage> {
  return listProducts({ featured: true, limit });
}
