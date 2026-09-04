import { MessageCircle, Phone } from "lucide-react";
import { useMemo } from "react";
import * as api from "@/api";
import { PAGE_SIZE } from "@/api";
import { useSite } from "@/context/SiteSettingsContext";
import { useCollection, usePagedProducts } from "@/hooks/useCatalogue";
import { Seo, collectionSchema } from "@/lib/seo";
import type { Collection } from "@/types/api";
import { CategoryGrid, CtaSection } from "@/components/sections";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { NotFoundPage } from "@/components/layout/RootLayout";
import {
  CategoryGridSkeleton,
  EmptyState,
  LoadingAnnouncer,
  PageErrorState,
  ProductGridSkeleton,
} from "@/components/ui-kit/AsyncStates";
import { LoadMore } from "@/components/ui-kit/LoadMore";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import {
  ButtonAnchor,
  Container,
  JsonLd,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

/**
 * Renders any of the twelve collection routes. The route path is still the key
 * — `/gold-jewellery` and friends are unchanged — but the content behind it now
 * comes from the API instead of the bundled catalogue.
 */
export function CategoryPage({ path }: { path: string }) {
  const { data: collection, loading, error, notFound, reload } = useCollection(path);

  if (notFound) return <NotFoundPage />;

  if (loading) return <CategoryPageSkeleton path={path} />;

  if (error || !collection) {
    return <PageErrorState message={error ?? undefined} onRetry={reload} />;
  }

  return <CategoryPageBody collection={collection} />;
}

/**
 * Split from the loader above so the paging hook is seeded with the products
 * that already arrived with the collection. The card, the grid and the spacing
 * are untouched — the only addition is a button underneath it.
 */
function CategoryPageBody({ collection }: { collection: Collection }) {
  const { primaryPhone, telLink, whatsappLink } = useSite();

  const seed = useMemo(
    () => ({ products: collection.products, total: collection.productPage.total }),
    [collection.products, collection.productPage.total],
  );

  const grid = usePagedProducts(
    (page, signal) =>
      api.getProductPage({ collection: collection.slug, page, limit: PAGE_SIZE }, { signal }),
    [collection.slug],
    seed,
  );

  const photosEnquiry = whatsappLink(
    `Hello Madhuri Jewellers, please send me photographs from your ${collection.name}.`,
  );
  const budgetEnquiry = whatsappLink(
    `Hello Madhuri Jewellers, I'm looking at ${collection.name}. My budget is around ₹`,
  );

  return (
    <>
      <Seo
        title={collection.seoTitle ?? `${collection.name} | Madhuri Jewellers, Secunderabad`}
        description={
          collection.seoDescription ??
          collection.intro ??
          `${collection.name} at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.`
        }
        path={collection.path}
      />

      <JsonLd
        data={collectionSchema({
          name: collection.name,
          description: collection.seoDescription ?? "",
          path: collection.path,
          items: grid.products.map((p) => ({ name: p.name, description: p.description })),
        })}
      />

      <PageHero
        eyebrow={collection.eyebrow}
        title={collection.heroTitle}
        {...(collection.heroLine ? { line: collection.heroLine } : {})}
        {...(collection.intro ? { intro: collection.intro } : {})}
        image={collection.banner}
        trail={[
          { label: "Home", path: "/" },
          { label: collection.name, path: collection.path },
        ]}
      />

      {/* Category facts */}
      {collection.highlights.length > 0 ? (
        <Section className="py-14 sm:py-16" tone="surface">
          <Container>
            <dl className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
              {collection.highlights.map((item) => (
                <div key={item.label} className="bg-card px-7 py-8">
                  <dt className="text-[0.6rem] uppercase tracking-[0.24em] text-brand">
                    {item.label}
                  </dt>
                  <dd className="mt-3 text-base leading-snug text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>
      ) : null}

      {/* The grid */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="In the showroom"
            title={`${collection.name} on display`}
            intro="Weight ranges and design counts are what we hold in store today. Every piece can also be made to order in a different weight, finish or stone."
            align="left"
            action={
              photosEnquiry ? (
                <ButtonAnchor href={photosEnquiry} variant="outline">
                  <MessageCircle aria-hidden className="h-4 w-4" /> Ask for photos
                </ButtonAnchor>
              ) : null
            }
          />
          {grid.products.length > 0 ? (
            <>
              <ProductGrid
                products={grid.products}
                collectionName={collection.name}
                className="mt-14"
              />
              <LoadMore
                hasMore={grid.hasMore}
                loading={grid.loadingMore}
                error={grid.error}
                shown={grid.products.length}
                total={grid.total}
                onLoadMore={grid.loadMore}
                noun="pieces"
              />
            </>
          ) : (
            <EmptyState
              title="This counter is being photographed"
              body={`We are updating the ${collection.name.toLowerCase()} photographs. Message us and we will send what is in store today.`}
              className="mt-14"
            />
          )}
        </Container>
      </Section>

      {/* Craft note */}
      {collection.craftNote ? (
        <Section tone="surface" className="py-16 sm:py-20">
          <Container>
            <Reveal className="mx-auto max-w-3xl border-l border-brand/40 pl-6 sm:pl-10">
              <p className="eyebrow">How it is made</p>
              <p className="mt-4 font-display text-xl leading-relaxed text-foreground/90 sm:text-2xl">
                {collection.craftNote}
              </p>
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {/* Enquiry strip */}
      <Section className="py-16">
        <Container>
          <div className="flex flex-col items-center gap-6 border border-brand/25 surface-card px-6 py-12 text-center">
            <h2 className="max-w-2xl text-balance font-display text-2xl leading-snug text-foreground sm:text-3xl">
              Tell us the budget and the occasion — we will pull the right tray before you arrive
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Send a message with your weight range or budget and we will photograph what matches
              from the {collection.name.toLowerCase()} counter the same day.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {budgetEnquiry ? (
                <ButtonAnchor href={budgetEnquiry}>
                  <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp us
                </ButtonAnchor>
              ) : null}
              {primaryPhone ? (
                <ButtonAnchor href={telLink(primaryPhone)} variant="outline" external={false}>
                  <Phone aria-hidden className="h-4 w-4" /> +91 {primaryPhone}
                </ButtonAnchor>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* Related */}
      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="Also look at"
            title="Related collections"
            intro="Most customers who come in for one of these leave having compared it against the others."
          />
          <CategoryGrid collections={collection.related} className="mt-14" />
        </Container>
      </Section>

      <CtaSection />
    </>
  );
}

/** Turns "/gold-jewellery" into "Gold Jewellery" for the loading title. */
function titleFromPath(path: string) {
  return path
    .replace(/^\//, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Holds the page's shape while the collection loads, so nothing jumps. */
function CategoryPageSkeleton({ path }: { path: string }) {
  const name = titleFromPath(path);

  return (
    <>
      <Seo
        title={`${name} | Madhuri Jewellers, Secunderabad`}
        description={`${name} at Madhuri Jewellers, Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad.`}
        path={path}
      />
      <LoadingAnnouncer label="Loading collection" />
      <header className="border-b border-border bg-secondary">
        <Container className="px-5 pb-16 pt-12 sm:pb-20 sm:pt-14">
          <div aria-hidden className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <span className="block h-2 w-32 animate-pulse bg-border/60" />
            <span className="block h-12 w-80 max-w-full animate-pulse bg-border/60" />
            <span className="block h-3 w-full max-w-md animate-pulse bg-border/60" />
          </div>
        </Container>
      </header>

      <Section>
        <Container>
          <div aria-hidden className="flex flex-col gap-4">
            <span className="block h-2 w-28 animate-pulse bg-border/60" />
            <span className="block h-9 w-72 max-w-full animate-pulse bg-border/60" />
          </div>
          <ProductGridSkeleton className="mt-14" count={6} />
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <CategoryGridSkeleton count={3} />
        </Container>
      </Section>
    </>
  );
}
