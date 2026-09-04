import { Link } from "react-router-dom";
import { ExternalLink, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { collections as collectionsApi } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import { Badge, Button, Card, EmptyState, ErrorState, Select, TableSkeleton } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useAsync } from "@/hooks/useAsync";
import type { Collection } from "@/types";
import { formatDate, thumb } from "@/utils/format";

export function CollectionsPage() {
  const { data, loading, error, reload } = useAsync(
    (signal) => collectionsApi.list({ signal }),
    [],
  );

  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [deleting, setDeleting] = useState(false);

  const collections = data ?? [];
  const others = collections.filter((item) => item.id !== pendingDelete?.id);
  const needsReassignment = (pendingDelete?.productCount ?? 0) > 0;

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    if (needsReassignment && !reassignTo) {
      toast.error("Choose where the products should move to.");
      return;
    }

    setDeleting(true);
    try {
      const result = await collectionsApi.remove(
        pendingDelete.id,
        needsReassignment ? reassignTo : undefined,
      );
      toast.success(`"${pendingDelete.name}" deleted`, {
        description:
          result.movedProducts > 0
            ? `${result.movedProducts} ${
                result.movedProducts === 1 ? "product was" : "products were"
              } moved.`
            : undefined,
      });
      setPendingDelete(null);
      setReassignTo("");
      reload();
    } catch (cause) {
      toast.error(
        cause instanceof ApiError ? cause.message : "Could not delete that collection.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Collections"
        description="The counters customers browse. Each one is a page on the website."
        action={
          <Link to="/collections/new">
            <Button size="sm">
              <Plus aria-hidden className="h-4 w-4" /> New collection
            </Button>
          </Link>
        }
      />

      <Card bodyClassName="p-0">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No collections yet"
            description="Collections group products and give the website its browsable pages."
            action={
              <Link to="/collections/new">
                <Button size="sm">
                  <Plus aria-hidden className="h-4 w-4" /> New collection
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[0.75rem] uppercase tracking-wide text-ink-2">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Collection
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Products
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Order
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
                {collections.map((collection) => (
                  <tr key={collection.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {collection.banner_image_url ? (
                          <img
                            src={thumb(collection.banner_image_url, 80)}
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
                            <Layers className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                            {collection.name}
                            {!collection.is_active ? <Badge tone="warning">Hidden</Badge> : null}
                          </p>
                          <p className="truncate text-xs text-ink-3">{collection.path}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums text-ink-2">
                      {collection.productCount}
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums text-ink-3">
                      {collection.sort_order}
                    </td>
                    <td className="px-3 py-3 text-xs text-ink-3">
                      {formatDate(collection.updated_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/collections/${collection.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Pencil aria-hidden className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit {collection.name}</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPendingDelete(collection);
                            setReassignTo("");
                          }}
                          className="text-danger hover:bg-danger-soft"
                        >
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete {collection.name}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-3">
        <ExternalLink aria-hidden className="h-3.5 w-3.5" />
        Collection routes such as /gold-jewellery are fixed in the website's code. Renaming a
        collection changes what the page says, not where it lives.
      </p>

      {/*
        A collection holding products cannot simply vanish — the database
        refuses it, and orphaned products would disappear from the site. The
        dialog turns that into a choice rather than an error.
      */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => {
          setPendingDelete(null);
          setReassignTo("");
        }}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this collection?"
        confirmLabel={needsReassignment ? "Move products and delete" : "Delete collection"}
        message={
          pendingDelete
            ? needsReassignment
              ? `"${pendingDelete.name}" holds ${pendingDelete.productCount} ${
                  pendingDelete.productCount === 1 ? "product" : "products"
                }. Choose where they should go — deleting will not remove them.`
              : `"${pendingDelete.name}" will be removed from the website. This cannot be undone.`
            : ""
        }
      >
        {needsReassignment ? (
          <Select
            id="reassignTo"
            label="Move products to"
            required
            value={reassignTo}
            onChange={(event) => setReassignTo(event.target.value)}
          >
            <option value="" disabled>
              Choose a collection
            </option>
            {others.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </Select>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
