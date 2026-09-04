import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { products as productsApi } from "@/api/endpoints";
import { Badge, Button, EmptyState, cn } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/Modal";
import type { ProductImage } from "@/types";
import { thumb, validateImage } from "@/utils/format";

/**
 * Multi-image management for one product: upload several at once, choose the
 * primary, reorder, edit alt text, delete individually.
 *
 * Reordering uses explicit move buttons rather than drag-and-drop. Dragging is
 * pleasant with a mouse and close to unusable with a keyboard or on a phone,
 * and this list is short enough that two buttons are faster anyway.
 */
export function ProductImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const upload = async (files: File[]) => {
    if (files.length === 0) return;

    const rejections = files.map(validateImage).filter(Boolean);
    if (rejections.length > 0) {
      toast.error(rejections[0] as string);
      return;
    }

    setUploading(true);
    try {
      const created = await productsApi.uploadImages(productId, files);
      onChange([...images, ...created]);
      toast.success(
        created.length === 1 ? "Image uploaded" : `${created.length} images uploaded`,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const setPrimary = async (image: ProductImage) => {
    setBusyId(image.id);
    try {
      await productsApi.setPrimaryImage(productId, image.id);
      onChange(images.map((item) => ({ ...item, is_primary: item.id === image.id })));
      toast.success("Primary image updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not set the primary image.");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const next = [...sorted];
    const moved = next[index];
    const swapped = next[target];
    if (!moved || !swapped) return;
    next[index] = swapped;
    next[target] = moved;

    // Optimistic: the list reorders immediately, then the server confirms.
    const reindexed = next.map((image, order) => ({ ...image, sort_order: order }));
    onChange(reindexed);

    try {
      await productsApi.reorderImages(
        productId,
        reindexed.map((image) => image.id),
      );
    } catch (error) {
      onChange(sorted);
      toast.error(error instanceof ApiError ? error.message : "Could not save the new order.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await productsApi.deleteImage(productId, pendingDelete.id);
      const remaining = images.filter((image) => image.id !== pendingDelete.id);

      // The API promotes a new primary when the primary is removed; mirror that
      // locally so the badge does not disappear until the next reload.
      if (pendingDelete.is_primary && remaining.length > 0) {
        const first = [...remaining].sort((a, b) => a.sort_order - b.sort_order)[0];
        onChange(remaining.map((image) => ({ ...image, is_primary: image.id === first?.id })));
      } else {
        onChange(remaining);
      }

      toast.success("Image removed");
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not remove that image.");
    } finally {
      setDeleting(false);
    }
  };

  const updateAlt = async (image: ProductImage, altText: string) => {
    if (altText === (image.alt_text ?? "")) return;
    try {
      const updated = await productsApi.updateImageAlt(productId, image.id, altText);
      onChange(images.map((item) => (item.id === image.id ? updated : item)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the description.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void upload(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2",
        )}
      >
        <input
          ref={fileInput}
          id="product-images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => void upload(Array.from(event.target.files ?? []))}
        />

        {uploading ? (
          <p className="flex items-center justify-center gap-2 text-sm text-ink-2">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Uploading to Cloudinary…
          </p>
        ) : (
          <>
            <Upload aria-hidden className="mx-auto mb-2 h-6 w-6 text-ink-3" />
            <p className="text-sm text-ink-2">
              Drag photographs here, or{" "}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="font-medium text-accent underline underline-offset-2"
              >
                choose files
              </button>
            </p>
            <p className="mt-1 text-xs text-ink-3">
              JPG, PNG, WebP or AVIF · up to 8 MB each · several at once
            </p>
          </>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No photographs yet"
          description="The first image you upload becomes the one shown on product cards."
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((image, index) => (
            <li
              key={image.id}
              className="flex flex-wrap items-start gap-4 rounded-lg border border-line bg-surface p-3 sm:flex-nowrap"
            >
              <img
                src={thumb(image.secure_url, 160)}
                alt=""
                aria-hidden
                width={72}
                height={72}
                loading="lazy"
                className="h-18 w-18 shrink-0 rounded-md border border-line object-cover"
                style={{ width: 72, height: 72 }}
              />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-ink-2">Image {index + 1}</span>
                  {image.is_primary ? <Badge tone="accent">Primary</Badge> : null}
                  {image.width && image.height ? (
                    <span className="text-xs text-ink-3">
                      {image.width}×{image.height}
                    </span>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`alt-${image.id}`} className="sr-only">
                    Description for image {index + 1}
                  </label>
                  <input
                    id={`alt-${image.id}`}
                    type="text"
                    defaultValue={image.alt_text ?? ""}
                    onBlur={(event) => void updateAlt(image, event.target.value)}
                    placeholder="Describe the photograph for screen readers and search engines"
                    className="h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.8125rem] placeholder:text-ink-3 focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                  title="Move earlier"
                >
                  <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Move image {index + 1} earlier</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void move(index, 1)}
                  disabled={index === sorted.length - 1}
                  title="Move later"
                >
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Move image {index + 1} later</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void setPrimary(image)}
                  disabled={image.is_primary || busyId === image.id}
                  title="Use as the main image"
                  className={image.is_primary ? "text-accent" : ""}
                >
                  <Star
                    aria-hidden
                    className={cn("h-3.5 w-3.5", image.is_primary && "fill-current")}
                  />
                  <span className="sr-only">Make image {index + 1} the primary</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDelete(image)}
                  className="text-danger hover:bg-danger-soft"
                  title="Delete image"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete image {index + 1}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this photograph?"
        confirmLabel="Delete image"
        message="The image will be removed from this product and deleted from Cloudinary. This cannot be undone."
      />
    </div>
  );
}
