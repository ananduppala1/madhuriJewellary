import { ArrowLeft, ArrowRight, Images, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { gallery as galleryApi } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  Toggle,
  cn,
} from "@/components/ui";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useAsync } from "@/hooks/useAsync";
import {
  GALLERY_CATEGORIES,
  GALLERY_SPANS,
  type GalleryCategory,
  type GalleryItem,
  type GallerySpan,
} from "@/types";
import { preview, thumb, validateImage } from "@/utils/format";

const SPAN_LABELS: Record<GallerySpan, string> = {
  normal: "Normal — one cell",
  wide: "Wide — two columns",
  tall: "Tall — two rows",
};

export function GalleryPage() {
  const [filter, setFilter] = useState<GalleryCategory | "">("");
  const state = useAsync((signal) => galleryApi.list({}, { signal }), []);

  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(() => {
    const all = (state.data ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    return filter ? all.filter((item) => item.category === filter) : all;
  }, [state.data, filter]);

  const move = async (item: GalleryItem, direction: -1 | 1) => {
    const ordered = (state.data ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const index = ordered.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;

    const next = [...ordered];
    const moved = next[index];
    const swapped = next[target];
    if (!moved || !swapped) return;
    next[index] = swapped;
    next[target] = moved;

    const reindexed = next.map((entry, order) => ({ ...entry, sort_order: order }));
    state.setData(reindexed);

    try {
      await galleryApi.reorder(reindexed.map((entry) => ({ id: entry.id, sortOrder: entry.sort_order })));
    } catch (error) {
      state.setData(ordered);
      toast.error(error instanceof ApiError ? error.message : "Could not save the new order.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await galleryApi.remove(pendingDelete.id);
      toast.success("Gallery item deleted");
      setPendingDelete(null);
      state.reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete that item.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Photographs on the website's /gallery page."
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="h-4 w-4" /> Add photograph
          </Button>
        }
      />

      <div
        role="group"
        aria-label="Filter by category"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setFilter("")}
          aria-pressed={filter === ""}
          className={cn(
            "rounded-full border px-3 py-1 text-[0.8125rem] transition-colors",
            filter === ""
              ? "border-accent-line bg-accent-soft font-medium text-accent"
              : "border-line-strong bg-surface text-ink-2 hover:bg-surface-2",
          )}
        >
          All
        </button>
        {GALLERY_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={cn(
              "rounded-full border px-3 py-1 text-[0.8125rem] transition-colors",
              filter === category
                ? "border-accent-line bg-accent-soft font-medium text-accent"
                : "border-line-strong bg-surface text-ink-2 hover:bg-surface-2",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {state.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-[4/3] w-full rounded-lg" />
          ))}
        </div>
      ) : state.error ? (
        <Card>
          <ErrorState message={state.error} onRetry={state.reload} />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Images}
            title={filter ? `No photographs in ${filter}` : "No photographs yet"}
            description="Gallery images appear on the website with the category filters customers can use."
            action={
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus aria-hidden className="h-4 w-4" /> Add photograph
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-surface-2">
                <img
                  src={thumb(item.secure_url, 480)}
                  alt={item.caption}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {!item.is_active ? (
                  <span className="absolute left-2 top-2">
                    <Badge tone="warning">Hidden</Badge>
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-[0.8125rem] font-medium text-ink">{item.caption}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="accent">{item.category}</Badge>
                  {item.span !== "normal" ? <Badge>{item.span}</Badge> : null}
                </div>

                <div className="flex items-center justify-between gap-1 border-t border-line pt-2">
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void move(item, -1)}
                      disabled={index === 0 || filter !== ""}
                      title={filter ? "Clear the filter to reorder" : "Move earlier"}
                    >
                      <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">Move earlier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void move(item, 1)}
                      disabled={index === items.length - 1 || filter !== ""}
                      title={filter ? "Clear the filter to reorder" : "Move later"}
                    >
                      <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">Move later</span>
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                      <Pencil aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete(item)}
                      className="text-danger hover:bg-danger-soft"
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <GalleryEditor
        open={creating || editing !== null}
        item={editing}
        nextOrder={(state.data ?? []).length}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          state.reload();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this photograph?"
        confirmLabel="Delete photograph"
        message="It will be removed from the gallery page and deleted from Cloudinary. This cannot be undone."
      />
    </>
  );
}

function GalleryEditor({
  open,
  item,
  nextOrder,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: GalleryItem | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = item !== null;
  const fileInput = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("Jewellery");
  const [span, setSpan] = useState<GallerySpan>("normal");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [key, setKey] = useState(0);

  // Re-seed the form whenever the dialog opens for a different item.
  const signature = `${open}-${item?.id ?? "new"}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setCaption(item?.caption ?? "");
    setCategory(item?.category ?? "Jewellery");
    setSpan(item?.span ?? "normal");
    setIsActive(item?.is_active ?? true);
    setFile(null);
    setErrors({});
    setKey((value) => value + 1);
  }

  const save = async () => {
    const found: Record<string, string> = {};
    if (caption.trim().length < 2) found.caption = "Add a caption.";
    if (!isEdit && !file) found.image = "Choose a photograph to upload.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (isEdit && item) {
        await galleryApi.update(
          item.id,
          { caption: caption.trim(), category, span, isActive },
          file,
        );
        toast.success("Gallery item updated");
      } else if (file) {
        await galleryApi.create(
          { caption: caption.trim(), category, span, isActive, sortOrder: nextOrder },
          file,
        );
        toast.success("Photograph added");
      }
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Could not save this gallery item.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit photograph" : "Add photograph"}
      description={
        isEdit ? "Leave the file empty to keep the current image." : "Uploaded to Cloudinary."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} loading={saving}>
            {isEdit ? "Save changes" : "Add photograph"}
          </Button>
        </>
      }
    >
      <div className="space-y-4" key={key}>
        {item ? (
          <img
            src={preview(item.secure_url, 600)}
            alt={item.caption}
            className="aspect-[4/3] w-full rounded-md border border-line object-cover"
          />
        ) : null}

        <div>
          <label htmlFor="gallery-file" className="field-label">
            {isEdit ? "Replace image" : "Photograph"}
            {!isEdit ? (
              <span aria-hidden className="ml-0.5 text-danger">
                *
              </span>
            ) : null}
          </label>
          <input
            ref={fileInput}
            id="gallery-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => {
              const chosen = event.target.files?.[0] ?? null;
              if (chosen) {
                const rejection = validateImage(chosen);
                if (rejection) {
                  setErrors((prev) => ({ ...prev, image: rejection }));
                  return;
                }
              }
              setErrors((prev) => {
                const next = { ...prev };
                delete next.image;
                return next;
              });
              setFile(chosen);
            }}
            className="w-full rounded-md border border-line-strong bg-surface p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-ink"
          />
          {errors.image ? (
            <p className="field-error">{errors.image}</p>
          ) : (
            <p className="field-hint">JPG, PNG, WebP or AVIF up to 8 MB.</p>
          )}
          {file ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
              <Upload aria-hidden className="h-3.5 w-3.5" />
              {file.name} ready to upload
            </p>
          ) : null}
        </div>

        <Input
          id="gallery-caption"
          label="Caption"
          required
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          {...(errors.caption ? { error: errors.caption } : {})}
          hint="Also used as the image's alt text."
          placeholder="Nakshi Lakshmi coins before stringing"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="gallery-category"
            label="Category"
            required
            value={category}
            onChange={(event) => setCategory(event.target.value as GalleryCategory)}
            {...(errors.category ? { error: errors.category } : {})}
          >
            {GALLERY_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Select
            id="gallery-span"
            label="Tile size"
            value={span}
            onChange={(event) => setSpan(event.target.value as GallerySpan)}
            {...(errors.span ? { error: errors.span } : {})}
            hint="How much room it takes in the grid."
          >
            {GALLERY_SPANS.map((option) => (
              <option key={option} value={option}>
                {SPAN_LABELS[option]}
              </option>
            ))}
          </Select>
        </div>

        <Toggle
          id="gallery-active"
          label="Visible on the website"
          checked={isActive}
          onChange={setIsActive}
        />
      </div>
    </Modal>
  );
}
