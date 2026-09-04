import { useCollections } from "@/hooks/useCatalogue";
import { Seo } from "@/lib/seo";
import { CategoryGrid, CtaSection, GoogleRating } from "@/components/sections";
import { CategoryGridSkeleton, EmptyState, ErrorState } from "@/components/ui-kit/AsyncStates";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import { Container, Section, SectionHeading } from "@/components/ui-kit/primitives";

const SEASONS = [
  {
    season: "Wedding season",
    months: "November – February",
    body: "Full bridal sets, vaddanam and guttapusalu. Order six weeks ahead if the design is being made rather than taken from stock.",
  },
  {
    season: "Festival edit",
    months: "August – November",
    body: "Lightweight daily gold, silver pooja articles and gifting pieces. Making charges are simplest here.",
  },
  {
    season: "Summer bench",
    months: "March – July",
    body: "The quiet months, and the best time for custom work — the karigars have room and the lead times shorten.",
  },
];

export function LatestCollectionsPage() {
  const { data, loading, error, reload } = useCollections();

  return (
    <>
      <Seo
        title="Latest Collections — Gold, Bridal, Temple & Diamond | Madhuri Jewellers"
        description="Browse every collection at Madhuri Jewellers, Secunderabad — bridal sets, temple nakshi work, antique finish, diamond, silver and everyday 22K gold."
        path="/latest-collections"
      />
      <PageHero
        eyebrow="Everything in store"
        title="Latest Collections"
        line="Twelve counters, one showroom on Vinayak Nagar X Road."
        intro="Each collection has its own bench and its own karigar. Start where the occasion takes you — bridal for a wedding, temple for a recital, lightweight for a Tuesday."
        image="bridal"
        trail={[
          { label: "Home", path: "/" },
          { label: "Latest Collections", path: "/latest-collections" },
        ]}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="All collections"
            title="Where would you like to begin?"
            intro="Twelve collections, each with weight ranges and design counts kept current with what is actually on the shelf."
          />
          {loading ? (
            <CategoryGridSkeleton count={6} className="mt-14" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="mt-14" />
          ) : data && data.length > 0 ? (
            <CategoryGrid collections={data} className="mt-14" />
          ) : (
            <EmptyState title="Collections are being updated" className="mt-14" />
          )}
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="Planning ahead"
            title="What we bring out, and when"
            intro="The showroom shifts with the calendar. If you are buying for a date, this is roughly how our year runs."
            align="left"
          />
          <div className="mt-14 divide-y divide-border border-y border-border">
            {SEASONS.map((item, index) => (
              <Reveal key={item.season} delay={index * 0.06}>
                <div className="grid gap-4 py-8 md:grid-cols-12 md:gap-8">
                  <p className="font-display text-2xl text-foreground md:col-span-4">
                    {item.season}
                  </p>
                  <p className="text-[0.66rem] uppercase tracking-[0.2em] text-brand md:col-span-3 md:pt-2">
                    {item.months}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground md:col-span-5">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <GoogleRating />
      <CtaSection />
    </>
  );
}
