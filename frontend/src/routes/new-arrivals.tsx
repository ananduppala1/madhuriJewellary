import { MessageCircle } from "lucide-react";
import { useSite } from "@/context/SiteSettingsContext";
import { useNewArrivals } from "@/hooks/useCatalogue";
import { Seo } from "@/lib/seo";
import { CtaSection, InstagramFeed } from "@/components/sections";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/ui-kit/AsyncStates";
import { LoadMore } from "@/components/ui-kit/LoadMore";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import { ButtonAnchor, Container, Section, SectionHeading } from "@/components/ui-kit/primitives";

export function NewArrivalsPage() {
  const { whatsappLink } = useSite();

  /**
   * This page used to ask for sixty products in one request and render all of
   * them. It now loads a page at a time and appends — the card, the four-column
   * grid and the spacing are unchanged, there is simply a button underneath.
   */
  const grid = useNewArrivals();

  const photosEnquiry = whatsappLink(
    "Hello Madhuri Jewellers, please send me photographs of your new arrivals.",
  );

  return (
    <>
      <Seo
        title="New Arrivals — Latest Gold & Diamond Designs | Madhuri Jewellers Secunderabad"
        description="The newest pieces off our bench — lightweight daily gold, Nizami jhumkas, diamond mangalsutra and made-to-order designs at Madhuri Jewellers, Malkajgiri."
        path="/new-arrivals"
      />
      <PageHero
        eyebrow="Fresh off the bench"
        title="New Arrivals"
        line="Photographed the day they were finished."
        intro="These are the designs that came off our workshop bench this month, plus the made-to-order pieces customers are commissioning most. Anything here can be adjusted in weight, finish or stone."
        image="lightweight"
        trail={[
          { label: "Home", path: "/" },
          { label: "New Arrivals", path: "/new-arrivals" },
        ]}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Added this month"
            title="Just in at the counter"
            intro="Weight ranges reflect what is on the shelf now. If your size or weight is not listed, we can make it."
            align="left"
            action={
              photosEnquiry ? (
                <ButtonAnchor href={photosEnquiry} variant="outline">
                  <MessageCircle aria-hidden className="h-4 w-4" /> Ask for photos
                </ButtonAnchor>
              ) : null
            }
          />
          {grid.loading ? (
            <ProductGridSkeleton count={8} columns={4} className="mt-14" />
          ) : grid.error && grid.products.length === 0 ? (
            <ErrorState message={grid.error} onRetry={grid.reload} className="mt-14" />
          ) : grid.products.length > 0 ? (
            <>
              <ProductGrid
                products={grid.products}
                collectionName="New Arrivals"
                columns={4}
                className="mt-14"
              />
              <LoadMore
                hasMore={grid.hasMore}
                loading={grid.loadingMore}
                error={grid.error}
                shown={grid.products.length}
                total={grid.total}
                onLoadMore={grid.loadMore}
                columns={4}
                noun="pieces"
              />
            </>
          ) : (
            <EmptyState
              title="Nothing new on the shelf this week"
              body="The bench is between batches. Message us and we will tell you what is being finished right now."
              className="mt-14"
            />
          )}
        </Container>
      </Section>

      <Section tone="surface" className="py-16 sm:py-20">
        <Container>
          <Reveal className="mx-auto max-w-3xl border-l border-brand/40 pl-6 sm:pl-10">
            <p className="eyebrow">Made to order</p>
            <p className="mt-4 font-display text-xl leading-relaxed text-foreground/90 sm:text-2xl">
              Bring a photograph — of your grandmother’s chandbali, of something you saw at a
              wedding, of a sketch on paper. Our karigars will tell you honestly what can be
              reproduced, what has to change, and what it will weigh.
            </p>
          </Reveal>
        </Container>
      </Section>

      <InstagramFeed />
      <CtaSection
        eyebrow="Hold a piece"
        title="Ask us to keep something aside"
        body="Send a message with the design name and we will set it aside for three days so you can see it in person without rushing."
        image="bridal"
      />
    </>
  );
}
