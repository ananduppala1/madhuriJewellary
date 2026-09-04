import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { collections as collectionsApi } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import { Button, Card, ErrorState, Input, Skeleton, Textarea, Toggle } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import type { Collection } from "@/types";
import { preview, slugify, validateImage } from "@/utils/format";

type Highlight = { label: string; value: string };

type FormState = {
  name: string;
  slug: string;
  eyebrow: string;
  heroTitle: string;
  heroLine: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  craftNote: string;
  sortOrder: string;
  isActive: boolean;
  highlights: Highlight[];
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  eyebrow: "",
  heroTitle: "",
  heroLine: "",
  intro: "",
  seoTitle: "",
  seoDescription: "",
  craftNote: "",
  sortOrder: "0",
  isActive: true,
  highlights: [],
};

function fromCollection(collection: Collection): FormState {
  return {
    name: collection.name,
    slug: collection.slug,
    eyebrow: collection.eyebrow,
    heroTitle: collection.hero_title,
    heroLine: collection.hero_line ?? "",
    intro: collection.intro ?? "",
    seoTitle: collection.seo_title ?? "",
    seoDescription: collection.seo_description ?? "",
    craftNote: collection.craft_note ?? "",
    sortOrder: String(collection.sort_order),
    isActive: collection.is_active,
    highlights: collection.highlights.map((item) => ({ label: item.label, value: item.value })),
  };
}

export function CollectionFormPage({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [banner, setBanner] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const bannerInput = useRef<HTMLInputElement>(null);

  const state = useAsync(
    (signal) =>
      mode === "edit" && id ? collectionsApi.get(id, { signal }) : Promise.resolve(null),
    [mode, id],
  );

  useEffect(() => {
    if (state.data) {
      setForm(fromCollection(state.data));
      setBanner(state.data.banner_image_url);
    }
  }, [state.data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const uploadBanner = async (file: File) => {
    if (!id) return;

    const rejection = validateImage(file);
    if (rejection) {
      toast.error(rejection);
      return;
    }

    setUploadingBanner(true);
    try {
      const updated = await collectionsApi.uploadBanner(id, file);
      setBanner(updated.banner_image_url);
      toast.success("Banner updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not upload that banner.");
    } finally {
      setUploadingBanner(false);
      if (bannerInput.current) bannerInput.current.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = "Give the collection a name.";
    if (form.highlights.some((item) => !item.label.trim() || !item.value.trim())) {
      found.highlights = "Every highlight needs both a label and a value.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      eyebrow: form.eyebrow.trim(),
      heroTitle: form.heroTitle.trim() || form.name.trim(),
      heroLine: form.heroLine.trim() || null,
      intro: form.intro.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      craftNote: form.craftNote.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      highlights: form.highlights.filter((item) => item.label.trim() && item.value.trim()),
    };

    try {
      if (mode === "create") {
        const created = await collectionsApi.create(payload);
        toast.success(`"${created.name}" created`);
        navigate(`/collections/${created.id}/edit`, { replace: true });
      } else if (id) {
        await collectionsApi.update(id, payload);
        toast.success("Changes saved");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Could not save this collection.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && state.loading) {
    return (
      <>
        <PageHeader title="Edit collection" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </>
    );
  }

  if (mode === "edit" && state.error) {
    return (
      <>
        <PageHeader title="Edit collection" />
        <Card>
          <ErrorState message={state.error} onRetry={state.reload} />
        </Card>
      </>
    );
  }

  const previewSlug = slugify(form.slug || form.name);

  return (
    <>
      <Link
        to="/collections"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-2 hover:text-ink"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Back to collections
      </Link>

      <PageHeader
        title={mode === "create" ? "New collection" : form.name || "Edit collection"}
        {...(previewSlug ? { description: `Appears at /${previewSlug}` } : {})}
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Basic information">
              <div className="space-y-4">
                <Input
                  id="name"
                  label="Collection name"
                  required
                  value={form.name}
                  onChange={(event) => {
                    update("name", event.target.value);
                    if (!slugTouched) update("slug", slugify(event.target.value));
                  }}
                  {...(errors.name ? { error: errors.name } : {})}
                  placeholder="Gold Jewellery"
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
                    mode === "edit"
                      ? "Changing this breaks existing links and search rankings."
                      : "Generated from the name."
                  }
                  placeholder="gold-jewellery"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="eyebrow"
                    label="Eyebrow"
                    value={form.eyebrow}
                    onChange={(event) => update("eyebrow", event.target.value)}
                    {...(errors.eyebrow ? { error: errors.eyebrow } : {})}
                    hint="The small line above the heading."
                    placeholder="22K & 18K"
                  />
                  <Input
                    id="heroTitle"
                    label="Hero title"
                    value={form.heroTitle}
                    onChange={(event) => update("heroTitle", event.target.value)}
                    {...(errors.heroTitle ? { error: errors.heroTitle } : {})}
                    hint="Defaults to the collection name."
                    placeholder="Gold Jewellery"
                  />
                </div>

                <Input
                  id="heroLine"
                  label="Hero line"
                  value={form.heroLine}
                  onChange={(event) => update("heroLine", event.target.value)}
                  {...(errors.heroLine ? { error: errors.heroLine } : {})}
                  placeholder="Weighed in front of you. Hallmarked before it leaves."
                />

                <Textarea
                  id="intro"
                  label="Introduction"
                  rows={4}
                  value={form.intro}
                  onChange={(event) => update("intro", event.target.value)}
                  {...(errors.intro ? { error: errors.intro } : {})}
                  hint="The paragraph under the page heading."
                />

                <Textarea
                  id="craftNote"
                  label="Craft note"
                  rows={3}
                  value={form.craftNote}
                  onChange={(event) => update("craftNote", event.target.value)}
                  {...(errors.craftNote ? { error: errors.craftNote } : {})}
                  hint='Shown in the "How it is made" band.'
                />
              </div>
            </Card>

            <Card
              title="Highlights"
              description="The three facts shown in a row beneath the page hero."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    update("highlights", [...form.highlights, { label: "", value: "" }])
                  }
                  disabled={form.highlights.length >= 8}
                >
                  <Plus aria-hidden className="h-3.5 w-3.5" /> Add
                </Button>
              }
            >
              {form.highlights.length === 0 ? (
                <p className="text-sm text-ink-2">
                  No highlights. The facts row is hidden on the website when there are none.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <Input
                        id={`highlight-label-${index}`}
                        label="Label"
                        className="w-40 shrink-0"
                        value={highlight.label}
                        onChange={(event) => {
                          const next = [...form.highlights];
                          next[index] = { ...highlight, label: event.target.value };
                          update("highlights", next);
                        }}
                        placeholder="Purity"
                      />
                      <Input
                        id={`highlight-value-${index}`}
                        label="Value"
                        className="flex-1"
                        value={highlight.value}
                        onChange={(event) => {
                          const next = [...form.highlights];
                          next[index] = { ...highlight, value: event.target.value };
                          update("highlights", next);
                        }}
                        placeholder="22K / 916 & 18K / 750"
                      />
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() =>
                          update(
                            "highlights",
                            form.highlights.filter((_, i) => i !== index),
                          )
                        }
                        className="text-danger hover:bg-danger-soft"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                        <span className="sr-only">Remove highlight {index + 1}</span>
                      </Button>
                    </div>
                  ))}
                  {errors.highlights ? <p className="field-error">{errors.highlights}</p> : null}
                </div>
              )}
            </Card>

            <Card title="Search engine listing">
              <div className="space-y-4">
                <Input
                  id="seoTitle"
                  label="SEO title"
                  value={form.seoTitle}
                  onChange={(event) => update("seoTitle", event.target.value)}
                  {...(errors.seoTitle ? { error: errors.seoTitle } : {})}
                  hint="Around 60 characters reads best in Google."
                />
                <Textarea
                  id="seoDescription"
                  label="SEO description"
                  rows={3}
                  value={form.seoDescription}
                  onChange={(event) => update("seoDescription", event.target.value)}
                  {...(errors.seoDescription ? { error: errors.seoDescription } : {})}
                  hint="Around 150–160 characters."
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Publishing">
              <Toggle
                id="isActive"
                label="Visible on the website"
                description="Hiding a collection also hides its products."
                checked={form.isActive}
                onChange={(value) => update("isActive", value)}
              />
              <div className="mt-4">
                <Input
                  id="sortOrder"
                  label="Sort order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => update("sortOrder", event.target.value)}
                  {...(errors.sortOrder ? { error: errors.sortOrder } : {})}
                  hint="Lower numbers appear first."
                />
              </div>
            </Card>

            <Card title="Banner image" description="Used behind the page hero and on cards.">
              {mode === "create" ? (
                <p className="flex items-start gap-2 rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-2">
                  <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                  Save the collection first, then upload its banner.
                </p>
              ) : (
                <div className="space-y-3">
                  {banner ? (
                    <img
                      src={preview(banner, 600)}
                      alt="Current collection banner"
                      className="aspect-[3/2] w-full rounded-md border border-line object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-line-strong bg-surface-2 text-sm text-ink-3">
                      No banner yet
                    </div>
                  )}

                  <input
                    ref={bannerInput}
                    id="banner"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadBanner(file);
                    }}
                  />
                  <Button
                    variant="secondary"
                    className="w-full"
                    loading={uploadingBanner}
                    onClick={() => bannerInput.current?.click()}
                  >
                    <Upload aria-hidden className="h-4 w-4" />
                    {banner ? "Replace banner" : "Upload banner"}
                  </Button>
                  <p className="text-xs text-ink-3">
                    Landscape works best. JPG, PNG, WebP or AVIF up to 8 MB.
                  </p>
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" loading={saving} className="w-full">
                {mode === "create" ? "Create collection" : "Save changes"}
              </Button>
              <Link to="/collections" className="w-full">
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
