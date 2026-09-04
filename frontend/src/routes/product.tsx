import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { useSite } from "@/context/SiteSettingsContext";
import { useProduct } from "@/hooks/useCatalogue";
import { BRAND_NAME, SITE_URL } from "@/data/site";
import { remoteImage } from "@/lib/media";
import { Seo, productSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Product, ProductImage } from "@/types/api";
import { CtaSection } from "@/components/sections";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { NotFoundPage } from "@/components/layout/RootLayout";
import { ErrorState, MissingImage } from "@/components/ui-kit/AsyncStates";
import { Breadcrumbs } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import {
  AssayDivider,
  ButtonAnchor,
  Container,
  Eyebrow,
  HallmarkFrame,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

/* ── image gallery ─────────────────────────────────────────── */

function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // A different product means a different set of photographs.
  useEffect(() => {
    setActive(0);
    setLoaded(false);
  }, [name]);

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      <HallmarkFrame inset="1rem">
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-muted">
          {/* A piece with no photograph shows that it has none. Substituting a
              different product's image here would attach one necklace's
              photography to another necklace's name and price enquiry. */}
          {!current ? <MissingImage className="absolute inset-0 border-0" /> : null}
          {current ? (
            <motion.img
              key={current.url}
              src={remoteImage(current.url, { width: 1200 }) ?? ""}
              alt={current.alt ?? `${name} at Madhuri Jewellers, Secunderabad`}
              width={900}
              height={1100}
              decoding="async"
              fetchPriority="high"
              onLoad={() => setLoaded(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full object-cover"
            />
          ) : null}
          {/* Holds the frame steady while the photograph decodes. */}
          {current && !loaded ? (
            <span aria-hidden className="absolute inset-0 animate-pulse bg-border/50" />
          ) : null}
        </div>
      </HallmarkFrame>

      {images.length > 1 ? (
        <div
          role="group"
          aria-label={`More photographs of ${name}`}
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => {
                setActive(index);
                setLoaded(false);
              }}
              aria-label={`View photograph ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={cn(
                "group relative aspect-square overflow-hidden border transition-all duration-300",
                index === active
                  ? "border-brand"
                  : "border-border hover:border-brand/60 focus-visible:border-brand",
              )}
            >
              <img
                src={remoteImage(image.url, { width: 240, height: 240, crop: "fill" }) ?? ""}
                alt=""
                aria-hidden
                width={240}
                height={240}
                loading="lazy"
                decoding="async"
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  index === active ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── detail rows ───────────────────────────────────────────── */

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="border-t border-border py-4">
      <dt className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-sm text-foreground/90">{value}</dd>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────── */

export function ProductPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, loading, error, notFound, reload } = useProduct(slug);

  if (notFound) return <NotFoundPage />;

  if (loading) return <ProductPageSkeleton />;

  if (error || !data) {
    return (
      <Section>
        <Container>
          <ErrorState message={error ?? undefined} onRetry={reload} className="mx-auto max-w-xl" />
        </Container>
      </Section>
    );
  }

  return <ProductDetail product={data} related={data.related} />;
}

function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { site, primaryPhone, whatsappLink, telLink } = useSite();

  const collectionName = product.collection?.name ?? BRAND_NAME;
  const productUrl = `${site?.url ?? SITE_URL}/product/${product.slug}`;

  /**
   * The enquiry carries the details the counter needs to pull the right tray —
   * name, collection, purity, weight and the page itself — so the first reply
   * can be a photograph rather than a question. Encoding is handled by
   * `whatsappLink`, which runs the whole body through encodeURIComponent.
   */
  const enquiry = whatsappLink(
    [
      "Hello Madhuri Jewellers,",
      "I am interested in:",
      `Product: ${product.name}`,
      `Collection: ${collectionName}`,
      product.purity ? `Purity: ${product.purity}` : null,
      product.weight ? `Weight: ${product.weight}` : null,
      `Product URL: ${productUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  const cover = product.images.find((image) => image.isPrimary) ?? product.images[0];

  return (
    <>
      <Seo
        title={`${product.name} — ${collectionName} | Madhuri Jewellers`}
        description={
          product.description ||
          `${product.name} in ${collectionName} at Madhuri Jewellers, Old Neredmet, Secunderabad.`
        }
        path={`/product/${product.slug}`}
        {...(cover?.url ? { image: cover.url } : {})}
      />
      <productSchema.Tag product={product} url={productUrl} />

      <Section className="pb-14 pt-10 sm:pb-16 sm:pt-12">
        <Container>
          <Breadcrumbs
            trail={[
              { label: "Home", path: "/" },
              ...(product.collection
                ? [{ label: product.collection.name, path: product.collection.path }]
                : []),
              { label: product.name, path: `/product/${product.slug}` },
            ]}
            className="mb-10 [&_ol]:justify-start"
          />

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left — photographs. First on mobile, which is the order the
                layout already reads in on a phone. */}
            <Reveal direction="right">
              <Gallery images={product.images} name={product.name} />
            </Reveal>

            {/* Right — the piece itself. */}
            <Reveal direction="left" className="flex flex-col">
              {product.badge ? (
                <span className="mb-5 inline-flex w-fit bg-primary px-3.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground">
                  {product.badge}
                </span>
              ) : null}

              {product.purity ? <Eyebrow>{product.purity}</Eyebrow> : null}

              <h1 className="mt-4 text-balance font-display text-3xl leading-[1.1] text-foreground sm:text-4xl lg:text-[2.7rem]">
                {product.name}
              </h1>

              <AssayDivider className="my-7 max-w-xs justify-start" />

              {product.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {product.description}
                </p>
              ) : null}

              <dl className="mt-9">
                <Detail label="Purity" value={product.purity} />
                <Detail label="Weight range" value={product.weight} />
                <Detail label="Availability" value={product.designs} />
                <Detail label="Collection" value={product.collection?.name ?? null} />
              </dl>

              <div className="mt-9 flex flex-wrap gap-3">
                {enquiry ? (
                  <ButtonAnchor href={enquiry}>
                    <MessageCircle aria-hidden className="h-4 w-4" /> Enquire on WhatsApp
                  </ButtonAnchor>
                ) : null}
                {primaryPhone ? (
                  <ButtonAnchor href={telLink(primaryPhone)} variant="outline" external={false}>
                    <Phone aria-hidden className="h-4 w-4" /> +91 {primaryPhone}
                  </ButtonAnchor>
                ) : null}
              </div>

              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                Weight ranges reflect what is on the shelf today. Anything here can be made to order
                in a different weight, finish or stone — tell us the occasion and the budget.
              </p>

              {product.collection ? (
                <Link
                  to={product.collection.path}
                  className="mt-8 inline-flex w-fit items-center gap-2 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground"
                >
                  All {product.collection.name}
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </Reveal>
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section tone="surface">
          <Container>
            <SectionHeading
              eyebrow="From the same counter"
              title="You may also like"
              intro="Pieces our customers usually compare this one against before deciding."
              align="left"
            />
            <ProductGrid products={related} collectionName={collectionName} className="mt-14" />
          </Container>
        </Section>
      ) : null}

      <CtaSection />
    </>
  );
}

function ProductPageSkeleton() {
  return (
    <Section className="pb-14 pt-10 sm:pb-16 sm:pt-12">
      <Container>
        <span role="status" aria-live="polite" className="sr-only">
          Loading product
        </span>
        <div aria-hidden className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <span className="block aspect-[4/5] w-full animate-pulse border border-border bg-border/50" />
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  key={index}
                  className="block aspect-square animate-pulse border border-border bg-border/50"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <span className="block h-2 w-28 animate-pulse bg-border/60" />
            <span className="block h-10 w-4/5 animate-pulse bg-border/60" />
            <span className="block h-px w-40 bg-border" />
            <span className="block h-3 w-full animate-pulse bg-border/60" />
            <span className="block h-3 w-5/6 animate-pulse bg-border/60" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <span key={index} className="block h-12 w-full animate-pulse bg-border/40" />
              ))}
            </div>
            <span className="mt-4 block h-12 w-52 animate-pulse bg-border/60" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
