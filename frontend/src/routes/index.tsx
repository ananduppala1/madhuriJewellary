import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BRAND_NAME } from "@/data/site";
import { useBestSellers, useFeaturedCollections, useFeaturedProducts } from "@/hooks/useCatalogue";
import { assetImage, remoteImage } from "@/lib/media";
import { Seo } from "@/lib/seo";
import {
  CategoryBentoGrid,
  Craftsmanship,
  CtaSection,
  GoogleRating,
  InstagramFeed,
  LocationSection,
  StatsBar,
  TestimonialsSection,
  TrustTicker,
  WhyChooseUs,
} from "@/components/sections";
import { HeroSlider } from "@/components/sections/HeroSlider";
import { ProductGrid } from "@/components/sections/ProductGrid";
import {
  CategoryGridSkeleton,
  EmptyState,
  MissingImage,
  ProductGridSkeleton,
} from "@/components/ui-kit/AsyncStates";
import { Reveal } from "@/components/ui-kit/Reveal";
import {
  AssayDivider,
  ButtonLink,
  Container,
  Eyebrow,
  HallmarkFrame,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

export function HomePage() {
  /**
   * The old page concatenated two hardcoded arrays (bridalPicks + bestSellers).
   * That selection is now a database decision: `is_featured` is set by the seed
   * for Bridal Pick and Best Seller badges, and by the admin thereafter.
   */
  const featuredProducts = useFeaturedProducts(6);
  const bestSellers = useBestSellers(6);
  const featuredCollections = useFeaturedCollections();

  return (
    <>
      <Seo
        title={`${BRAND_NAME} — 22K Gold, Bridal & Temple Jewellery in Secunderabad`}
        description="BIS hallmarked 22K gold, bridal sets, temple and antique jewellery hand-finished at Madhuri Jewellers, Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad."
        path="/"
      />

      <HeroSlider />
      <StatsBar />
      <TrustTicker />

      {/* About preview */}
      <Section>
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal direction="right">
            <HallmarkFrame inset="1.25rem">
              <img
                src={assetImage("store")}
                alt="The main hall at Madhuri Jewellers on Vinayak Nagar X Road, Old Neredmet"
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
                className="aspect-[5/4] w-full border border-border object-cover"
              />
            </HallmarkFrame>
          </Reveal>

          <Reveal direction="left">
            <Eyebrow>Since 2004</Eyebrow>
            <h2 className="mt-4 text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl lg:text-[2.7rem]">
              One counter, one family, twenty years on the same road
            </h2>
            <AssayDivider className="my-7 max-w-xs justify-start" />
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Madhuri Jewellers opened on Vinayak Nagar X Road with one glass case and two karigars.
              The rule then is the rule now: you see the scale, the assay and the estimate before
              anything is wrapped.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Families come here for a first chain at a naming ceremony and return two decades later
              for that same child’s bridal set. That arc is how we judge whether we are doing this
              properly.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/about" variant="outline">
                Our story <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Categories */}
      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="Browse the counters"
            title="Six collections, one showroom"
            intro="Bridal, temple, antique, diamond, everyday gold and silver — each with its own bench and its own karigar."
          />
          {featuredCollections.loading ? (
            <CategoryGridSkeleton count={6} className="mt-14" />
          ) : featuredCollections.data && featuredCollections.data.length > 0 ? (
            <CategoryBentoGrid collections={featuredCollections.data} className="mt-14" />
          ) : (
            <EmptyState
              title="Collections are being updated"
              body="Our counters are being re-photographed. Message us and we will send what is in store."
              className="mt-14"
            />
          )}
        </Container>
      </Section>

      {/* Featured jewellery */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Featured this month"
            title="Pieces worth the drive"
            intro="What the counter staff are pulling out most often right now — bridal picks and long-standing best sellers."
            align="left"
            action={
              <ButtonLink to="/latest-collections" variant="outline">
                All collections
              </ButtonLink>
            }
          />
          {featuredProducts.loading ? (
            <ProductGridSkeleton count={6} className="mt-14" />
          ) : featuredProducts.data && featuredProducts.data.length > 0 ? (
            <ProductGrid
              products={featuredProducts.data}
              collectionName="Featured"
              className="mt-14"
            />
          ) : (
            <EmptyState className="mt-14" />
          )}
        </Container>
      </Section>

      {/* Best sellers strip */}
      <Section tone="surface" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Best sellers"
            title="What Secunderabad actually buys"
            intro="Ranked by what leaves the store, not by what we would like to sell you."
            align="left"
          />
          {bestSellers.loading ? (
            <ol aria-hidden className="mt-12 divide-y divide-border border-y border-border">
              {Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="flex items-center gap-5 py-5 sm:gap-8">
                  <span className="block h-4 w-5 animate-pulse bg-border/60" />
                  <span className="block h-16 w-14 shrink-0 animate-pulse bg-border/60 sm:h-20 sm:w-16" />
                  <span className="flex-1">
                    <span className="block h-5 w-2/5 animate-pulse bg-border/60" />
                    <span className="mt-2 block h-3 w-1/4 animate-pulse bg-border/50" />
                  </span>
                </li>
              ))}
            </ol>
          ) : bestSellers.data && bestSellers.data.length > 0 ? (
            <ol className="mt-12 divide-y divide-border border-y border-border">
              {bestSellers.data.slice(0, 6).map((product, index) => {
                const cover = product.images.find((image) => image.isPrimary) ?? product.images[0];

                return (
                  <li key={product.slug}>
                    <Link
                      to={`/product/${product.slug}`}
                      className="group flex items-center gap-5 py-5 transition-colors sm:gap-8"
                    >
                      <span className="font-display text-sm tabular-nums text-brand">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {remoteImage(cover?.url, { width: 200 }) ? (
                        <img
                          src={remoteImage(cover?.url, { width: 200 }) ?? ""}
                          alt=""
                          aria-hidden
                          width={200}
                          height={244}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-14 shrink-0 border border-border object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100 sm:h-20 sm:w-16"
                        />
                      ) : (
                        <MissingImage label="" className="h-16 w-14 shrink-0 sm:h-20 sm:w-16" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg text-foreground transition-colors group-hover:text-brand sm:text-xl">
                          {product.name}
                        </span>
                        <span className="mt-1 block text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
                          {[product.collection?.name, product.purity].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-sm text-foreground/70 md:block">
                        {product.weight}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-brand transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState className="mt-12" />
          )}
        </Container>
      </Section>

      <WhyChooseUs />
      <Craftsmanship />
      <TestimonialsSection />
      <InstagramFeed />
      <GoogleRating />
      <LocationSection />
      <CtaSection />
    </>
  );
}
