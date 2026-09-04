import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { collections as collectionsApi, products as productsApi } from "@/api/endpoints";
import { ProductImageManager } from "@/components/ProductImageManager";
import { PageHeader } from "@/components/layout/AdminLayout";
import { Button, Card, ErrorState, Input, Select, Skeleton, Textarea, Toggle } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { PRODUCT_BADGES, type Product, type ProductBadge, type ProductImage } from "@/types";
import { slugify } from "@/utils/format";

type FormState = {
  name: string;
  slug: string;
  description: string;
  purity: string;
  weight: string;
  designs: string;
  badge: ProductBadge | "";
  collectionId: string;
  isActive: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  sortOrder: string;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  purity: "",
  weight: "",
  designs: "",
  badge: "",
  collectionId: "",
  isActive: true,
  isNewArrival: false,
  isFeatured: false,
  sortOrder: "0",
};

function fromProduct(product: Product): FormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    purity: product.purity ?? "",
    weight: product.weight ?? "",
    designs: product.designs ?? "",
    badge: product.badge ?? "",
    collectionId: product.collection_id,
    isActive: product.is_active,
    isNewArrival: product.is_new_arrival,
    isFeatured: product.is_featured,
    sortOrder: String(product.sort_order),
  };
}

export function ProductFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // Once the slug exists on a live page, changing it breaks the link. It is
  // only editable on purpose.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const collectionsState = useAsync((signal) => collectionsApi.list({ signal }), []);

  const productState = useAsync(
    (signal) => (mode === "edit" && id ? productsApi.get(id, { signal }) : Promise.resolve(null)),
    [mode, id],
  );

  useEffect(() => {
    if (productState.data) {
      setForm(fromProduct(productState.data));
      setImages(productState.data.images);
    }
  }, [productState.data]);

  // A new product defaults into the first collection so the select is never
  // left in an invalid empty state.
  useEffect(() => {
    if (mode === "create" && !form.collectionId && collectionsState.data?.length) {
      const first = collectionsState.data[0];
      if (first) setForm((prev) => ({ ...prev, collectionId: first.id }));
    }
  }, [mode, form.collectionId, collectionsState.data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = (): boolean => {
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = "Give the piece a name.";
    if (!form.collectionId) found.collectionId = "Choose a collection.";

    const slug = form.slug || slugify(form.name);
    if (!slug) found.slug = "The name must contain letters or numbers.";

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim(),
      purity: form.purity.trim() || null,
      weight: form.weight.trim() || null,
      designs: form.designs.trim() || null,
      badge: (form.badge || null) as ProductBadge | null,
      collectionId: form.collectionId,
      isActive: form.isActive,
      isNewArrival: form.isNewArrival,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (mode === "create") {
        const created = await productsApi.create(payload);
        toast.success(`"${created.name}" created`, {
          description: "Add photographs to finish it off.",
        });
        navigate(`/products/${created.id}/edit`, { replace: true });
      } else if (id) {
        await productsApi.update(id, payload);
        toast.success("Changes saved");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Could not save this product.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && productState.loading) {
    return (
      <>
        <PageHeader title="Edit product" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (mode === "edit" && productState.error) {
    return (
      <>
        <PageHeader title="Edit product" />
        <Card>
          <ErrorState message={productState.error} onRetry={productState.reload} />
        </Card>
      </>
    );
  }

  const previewSlug = slugify(form.slug || form.name);

  return (
    <>
      <Link
        to="/products"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Back to products
      </Link>

      <PageHeader
        title={mode === "create" ? "New product" : form.name || "Edit product"}
        description={
          mode === "create"
            ? "Create the piece first, then add its photographs."
            : previewSlug
              ? `Appears at /product/${previewSlug}`
              : undefined
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Basic information">
              <div className="space-y-4">
                <Input
                  id="name"
                  label="Product name"
                  required
                  value={form.name}
                  onChange={(event) => {
                    update("name", event.target.value);
                    if (!slugTouched) update("slug", slugify(event.target.value));
                  }}
                  {...(errors.name ? { error: errors.name } : {})}
                  placeholder="Kasu Malai Long Haaram"
                />

                <Input
                  id="slug"
                  label="Web address"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update("slug", event.target.value);
                  }}
                  {...(errors.slug ? { error: errors.slug } : {})}
                  hint={
                    previewSlug
                      ? `/product/${previewSlug}${
                          mode === "edit" ? " — changing this breaks existing links" : ""
                        }`
                      : "Generated from the name"
                  }
                  placeholder="kasu-malai-long-haaram"
                />

                <Textarea
                  id="description"
                  label="Description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  {...(errors.description ? { error: errors.description } : {})}
                  hint="One or two sentences, as it reads on the product card."
                  placeholder="Rows of Lakshmi coins strung on a hand-braided chain…"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    id="purity"
                    label="Purity"
                    value={form.purity}
                    onChange={(event) => update("purity", event.target.value)}
                    {...(errors.purity ? { error: errors.purity } : {})}
                    placeholder="22K · 916 BIS Hallmark"
                  />
                  <Input
                    id="weight"
                    label="Weight range"
                    value={form.weight}
                    onChange={(event) => update("weight", event.target.value)}
                    {...(errors.weight ? { error: errors.weight } : {})}
                    placeholder="48 – 86 g"
                  />
                  <Input
                    id="designs"
                    label="Availability"
                    value={form.designs}
                    onChange={(event) => update("designs", event.target.value)}
                    {...(errors.designs ? { error: errors.designs } : {})}
                    placeholder="22 designs in store"
                  />
                </div>
              </div>
            </Card>

            <Card
              title="Photographs"
              description={
                mode === "create"
                  ? "Available once the product has been created."
                  : "The primary image is the one shown on cards and grids."
              }
            >
              {mode === "create" ? (
                <p className="flex items-start gap-2 rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-2">
                  <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                  Save the product first — photographs are attached to it afterwards.
                </p>
              ) : id ? (
                <ProductImageManager productId={id} images={images} onChange={setImages} />
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Publishing">
              <div className="space-y-3">
                <Toggle
                  id="isActive"
                  label="Visible on the website"
                  description="Switch off to hide without deleting."
                  checked={form.isActive}
                  onChange={(value) => update("isActive", value)}
                />
                <Toggle
                  id="isNewArrival"
                  label="New arrival"
                  description="Shows on the /new-arrivals page."
                  checked={form.isNewArrival}
                  onChange={(value) => update("isNewArrival", value)}
                />
                <Toggle
                  id="isFeatured"
                  label="Featured"
                  description="Shows in the home page grid."
                  checked={form.isFeatured}
                  onChange={(value) => update("isFeatured", value)}
                />
              </div>
            </Card>

            <Card title="Placement">
              <div className="space-y-4">
                <Select
                  id="collectionId"
                  label="Collection"
                  required
                  value={form.collectionId}
                  onChange={(event) => update("collectionId", event.target.value)}
                  {...(errors.collectionId ? { error: errors.collectionId } : {})}
                  disabled={collectionsState.loading}
                >
                  <option value="" disabled>
                    {collectionsState.loading ? "Loading…" : "Choose a collection"}
                  </option>
                  {(collectionsState.data ?? []).map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                      {collection.is_active ? "" : " (hidden)"}
                    </option>
                  ))}
                </Select>

                <Select
                  id="badge"
                  label="Badge"
                  value={form.badge}
                  onChange={(event) => update("badge", event.target.value as ProductBadge | "")}
                  {...(errors.badge ? { error: errors.badge } : {})}
                  hint="Shown as a ribbon on the product image."
                >
                  <option value="">No badge</option>
                  {PRODUCT_BADGES.map((badge) => (
                    <option key={badge} value={badge}>
                      {badge}
                    </option>
                  ))}
                </Select>

                <Input
                  id="sortOrder"
                  label="Sort order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => update("sortOrder", event.target.value)}
                  {...(errors.sortOrder ? { error: errors.sortOrder } : {})}
                  hint="Lower numbers appear first within the collection."
                />
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" loading={saving} className="w-full">
                {mode === "create" ? "Create product" : "Save changes"}
              </Button>
              <Link to="/products" className="w-full">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
