import { Link, useSearchParams } from "react-router-dom";
import { Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { collections as collectionsApi, products as productsApi } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useAsync, useDebounced } from "@/hooks/useAsync";
import { PRODUCT_BADGES, type Product, type ProductBadge } from "@/types";
import { formatDate, thumb } from "@/utils/format";

const PAGE_SIZE = 20;

/** Filters live in the URL, so a filtered view can be bookmarked and shared. */
function useFilterParams() {
  const [params, setParams] = useSearchParams();

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the current page number.
      if (!("page" in patch)) next.delete("page");
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  return { params, set };
}

export function ProductsPage() {
  const { params, set } = useFilterParams();

  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const search = useDebounced(searchInput, 350);

  const collectionId = params.get("collectionId") ?? "";
  const badge = params.get("badge") ?? "";
  const status = params.get("status") ?? "";
  const newArrivals = params.get("newArrivals") === "true";
  const featured = params.get("featured") === "true";
  const page = Number(params.get("page") ?? "1");

  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const collectionsState = useAsync((signal) => collectionsApi.list({ signal }), []);

  const listState = useAsync(
    (signal) =>
      productsApi.list(
        {
          search: search || undefined,
          collectionId: collectionId || undefined,
          badge: (badge || undefined) as ProductBadge | undefined,
          isActive: status === "" ? undefined : status === "active",
          newArrivals: newArrivals ? true : undefined,
          featured: featured ? true : undefined,
          page,
          limit: PAGE_SIZE,
        },
        { signal },
      ),
    [search, collectionId, badge, status, newArrivals, featured, page],
  );

  const activeFilterCount = useMemo(
    () =>
      [collectionId, badge, status, newArrivals ? "1" : "", featured ? "1" : ""].filter(Boolean)
        .length,
    [collectionId, badge, status, newArrivals, featured],
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await productsApi.remove(pendingDelete.id);
      toast.success(`"${pendingDelete.name}" deleted`);
      setPendingDelete(null);
      listState.reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete that product.");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    set({
      search: undefined,
      collectionId: undefined,
      badge: undefined,
      status: undefined,
      newArrivals: undefined,
      featured: undefined,
      page: undefined,
    });
  };

  const products = listState.data?.products ?? [];
  const meta = listState.data?.meta;

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything on the website's collection pages and grids."
        action={
          <Link to="/products/new">
            <Button size="sm">
              <Plus aria-hidden className="h-4 w-4" /> New product
            </Button>
          </Link>
        }
      />

      <Card className="mb-4" bodyClassName="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            />
            <input
              id="product-search"
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                set({ search: event.target.value || undefined });
              }}
              placeholder="Search by name or slug…"
              className="h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm placeholder:text-ink-3 focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="filter-collection" className="sr-only">
              Filter by collection
            </label>
            <select
              id="filter-collection"
              value={collectionId}
              onChange={(event) => set({ collectionId: event.target.value || undefined })}
              className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm focus:border-accent"
            >
              <option value="">All collections</option>
              {(collectionsState.data ?? []).map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-badge" className="sr-only">
              Filter by badge
            </label>
            <select
              id="filter-badge"
              value={badge}
              onChange={(event) => set({ badge: event.target.value || undefined })}
              className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm focus:border-accent"
            >
              <option value="">Any badge</option>
              {PRODUCT_BADGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(event) => set({ status: event.target.value || undefined })}
              className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm focus:border-accent"
            >
              <option value="">Any status</option>
              <option value="active">Visible</option>
              <option value="inactive">Hidden</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip
            active={newArrivals}
            onClick={() => set({ newArrivals: newArrivals ? undefined : "true" })}
          >
            New arrivals
          </FilterChip>
          <FilterChip
            active={featured}
            onClick={() => set({ featured: featured ? undefined : "true" })}
          >
            Featured
          </FilterChip>

          {activeFilterCount > 0 || searchInput ? (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-[0.8125rem] text-ink-2 hover:text-ink"
            >
              <X aria-hidden className="h-3.5 w-3.5" /> Clear filters
            </button>
          ) : null}
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {listState.loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : listState.error ? (
          <ErrorState message={listState.error} onRetry={listState.reload} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={
              searchInput || activeFilterCount > 0
                ? "No products match those filters"
                : "No products yet"
            }
            description={
              searchInput || activeFilterCount > 0
                ? "Try a different search, or clear the filters."
                : "Add your first piece and it will appear on the website straight away."
            }
            action={
              searchInput || activeFilterCount > 0 ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Link to="/products/new">
                  <Button size="sm">
                    <Plus aria-hidden className="h-4 w-4" /> New product
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-[0.75rem] uppercase tracking-wide text-ink-2">
                    <th scope="col" className="px-5 py-3 font-medium">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Collection
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Flags
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Updated
                    </th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((product) => {
                    const cover =
                      product.images.find((image) => image.is_primary) ?? product.images[0];

                    return (
                      <tr key={product.id} className="transition-colors hover:bg-surface-2">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {cover ? (
                              <img
                                src={thumb(cover.secure_url, 80)}
                                alt=""
                                aria-hidden
                                width={40}
                                height={40}
                                loading="lazy"
                                className="h-10 w-10 shrink-0 rounded-md border border-line object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-line-strong text-ink-3"
                              >
                                <Package className="h-4 w-4" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {product.name}
                              </p>
                              <p className="truncate text-xs text-ink-3">
                                /{product.slug}
                                {product.images.length > 1
                                  ? ` · ${product.images.length} images`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-ink-2">
                          {product.collection?.name ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {!product.is_active ? <Badge tone="warning">Hidden</Badge> : null}
                            {product.badge ? <Badge tone="accent">{product.badge}</Badge> : null}
                            {product.is_new_arrival ? <Badge tone="success">New</Badge> : null}
                            {product.is_featured ? <Badge>Featured</Badge> : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-ink-3">
                          {formatDate(product.updated_at)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <Link to={`/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Pencil aria-hidden className="h-3.5 w-3.5" />
                                <span className="sr-only">Edit {product.name}</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingDelete(product)}
                              className="text-danger hover:bg-danger-soft"
                            >
                              <Trash2 aria-hidden className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete {product.name}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta ? (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onChange={(next) => set({ page: String(next) })}
              />
            ) : null}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this product?"
        confirmLabel="Delete product"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed from the website, along with ${
                pendingDelete.images.length === 1
                  ? "its photograph"
                  : `its ${pendingDelete.images.length} photographs`
              }. This cannot be undone — to hide it temporarily instead, edit it and switch off "Visible on the website".`
            : ""
        }
      />
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-[0.8125rem] font-medium text-accent"
          : "rounded-full border border-line-strong bg-surface px-3 py-1 text-[0.8125rem] text-ink-2 hover:bg-surface-2"
      }
    >
      {children}
    </button>
  );
}
