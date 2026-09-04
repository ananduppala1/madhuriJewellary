import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "@/api";
import { PAGE_SIZE } from "@/api";
import { ApiError } from "@/lib/api-client";
import type {
  Collection,
  CollectionSummary,
  GalleryItem,
  Product,
  ProductDetail,
} from "@/types/api";

/**
 * One small async primitive behind every page. It handles the four states the
 * UI needs — loading, data, error, not-found — and cancels the in-flight
 * request when the component unmounts or the key changes, so a fast click
 * through the mega menu cannot land stale data on the new page.
 */

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
};

export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);
    setNotFound(false);

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        if (cause instanceof ApiError && cause.isNotFound) setNotFound(true);
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong loading this page.",
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, notFound, reload };
}

/* ── collections ───────────────────────────────────────────── */

export function useCollections(): AsyncState<CollectionSummary[]> {
  return useAsync((signal) => api.getCollections({ signal }), []);
}

export function useCollection(identifier: string): AsyncState<Collection> {
  return useAsync(
    (signal) => api.getCollection(identifier, { limit: PAGE_SIZE }, { signal }),
    [identifier],
  );
}

/** The six headline collections on the home page grid, in their existing order. */
const HOME_ORDER = [
  "/bridal-collection",
  "/temple-jewellery",
  "/gold-jewellery",
  "/diamond-jewellery",
  "/antique-jewellery",
  "/silver-jewellery",
];

export function useFeaturedCollections(): AsyncState<CollectionSummary[]> {
  const state = useCollections();

  const data = useMemo(() => {
    if (!state.data) return null;
    const byPath = new Map(state.data.map((item) => [item.path, item]));
    const ordered = HOME_ORDER.map((path) => byPath.get(path)).filter(
      (item): item is CollectionSummary => Boolean(item),
    );
    // If a collection was renamed in the dashboard, fall back to the first six.
    return ordered.length >= 6 ? ordered : state.data.slice(0, 6);
  }, [state.data]);

  return { ...state, data };
}

/* ── products ──────────────────────────────────────────────── */

export function useProduct(slug: string): AsyncState<ProductDetail> {
  return useAsync((signal) => api.getProduct(slug, { signal }), [slug]);
}

export function useFeaturedProducts(limit = 6): AsyncState<Product[]> {
  return useAsync((signal) => api.getFeatured(limit, { signal }), [limit]);
}

export function useBestSellers(limit = 6): AsyncState<Product[]> {
  return useAsync(
    (signal) => api.getProducts({ badge: "Best Seller", limit }, { signal }),
    [limit],
  );
}

/* ── paged product grids ───────────────────────────────────── */

export type PagedState = {
  products: Product[];
  total: number;
  loading: boolean;
  /** True only while a *further* page is arriving, not the first one. */
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
};

/**
 * Appends pages instead of replacing them.
 *
 * The page the visitor has already read is never re-rendered, which is what
 * keeps "Load more" from throwing away their scroll position — the browser has
 * no reason to move, because nothing above the button changed. New cards are
 * appended below, and the button is replaced by a skeleton row of the same
 * height while the next page is in flight so the page does not jump at the
 * moment of the click either.
 *
 * `initial` lets a page seed itself from data it already has — the collection
 * endpoint ships its first page of products with the hero — so opening a
 * collection is still one request, not two.
 */
export function usePagedProducts(
  fetchPage: (page: number, signal: AbortSignal) => Promise<api.Paged<Product>>,
  deps: readonly unknown[],
  initial?: { products: Product[]; total: number } | undefined,
): PagedState {
  const [products, setProducts] = useState<Product[]>(initial?.products ?? []);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!initial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const seeded = useRef(Boolean(initial));

  // Reset whenever the grid's identity changes — a different collection must
  // not inherit the previous one's products.
  useEffect(() => {
    setProducts(initial?.products ?? []);
    setTotal(initial?.total ?? 0);
    setPage(1);
    setError(null);
    seeded.current = Boolean(initial);
    setLoading(!initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  // Load page 1 only when the caller had nothing to seed it with.
  useEffect(() => {
    if (seeded.current) return;

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    fetchRef
      .current(1, controller.signal)
      .then((result) => {
        if (!active) return;
        setProducts(result.items);
        setTotal(result.meta.total);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong loading this page.",
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;

    const next = page + 1;
    const controller = new AbortController();

    setLoadingMore(true);
    setError(null);

    fetchRef
      .current(next, controller.signal)
      .then((result) => {
        // Append, de-duplicating by slug: if the shop reorders the catalogue
        // between two page requests a piece could otherwise arrive twice and
        // React would warn about a duplicate key.
        setProducts((current) => {
          const seen = new Set(current.map((item) => item.slug));
          return [...current, ...result.items.filter((item) => !seen.has(item.slug))];
        });
        setTotal(result.meta.total);
        setPage(next);
        setLoadingMore(false);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof ApiError ? cause.message : "We could not load any more pieces.");
        setLoadingMore(false);
      });
  }, [loading, loadingMore, page]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return {
    products,
    total,
    loading,
    loadingMore,
    error,
    hasMore: products.length < total,
    loadMore,
    reload,
  };
}

/** The new-arrivals grid: page one on load, further pages on request. */
export function useNewArrivals(limit = PAGE_SIZE): PagedState {
  return usePagedProducts(
    (page, signal) => api.getNewArrivalPage({ page, limit }, { signal }),
    [limit],
    undefined,
  );
}

/* ── gallery ───────────────────────────────────────────────── */

export function useGallery(): AsyncState<GalleryItem[]> {
  return useAsync((signal) => api.getGallery(undefined, { signal }), []);
}
