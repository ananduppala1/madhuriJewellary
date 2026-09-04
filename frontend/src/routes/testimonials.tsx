import { testimonials } from "@/data/content";
import { useSite } from "@/context/SiteSettingsContext";
import { reviewSchema, Seo } from "@/lib/seo";
import { CtaSection, TestimonialCard } from "@/components/sections";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui-kit/Reveal";
import {
  ButtonAnchor,
  Container,
  Eyebrow,
  JsonLd,
  Section,
  SectionHeading,
  Stars,
} from "@/components/ui-kit/primitives";

const BREAKDOWN = [
  { stars: 5, share: 94 },
  { stars: 4, share: 5 },
  { stars: 3, share: 1 },
  { stars: 2, share: 0 },
  { stars: 1, share: 0 },
];

export function TestimonialsPage() {
  const { site, mapsLink } = useSite();

  return (
    <>
      <Seo
        title="Customer Reviews & Testimonials | Madhuri Jewellers Secunderabad"
        description="Read what customers in Malkajgiri, Old Neredmet and Secunderabad say about buying bridal gold, exchanging old jewellery and getting repairs at Madhuri Jewellers."
        path="/testimonials"
      />
      <JsonLd
        data={reviewSchema(
          testimonials.map((t) => ({
            name: t.name,
            body: t.body,
            rating: t.rating,
            date: t.date,
          })),
        )}
      />

      <PageHero
        eyebrow="Customer reviews"
        title="Testimonials"
        {...(site?.rating != null && site.ratingCount != null
          ? { line: `${site.rating} out of 5 across ${site.ratingCount} Google reviews.` }
          : {})}
        intro="Most of these were written by people who live within three kilometres of the shop and have been coming for years. We have not edited them."
        image="bridal"
        trail={[
          { label: "Home", path: "/" },
          { label: "Testimonials", path: "/testimonials" },
        ]}
      />

      {/* Rating summary */}
      <Section tone="surface" className="py-14 sm:py-16">
        <Container>
          <Reveal className="grid gap-10 border border-brand/25 surface-card p-8 sm:p-12 lg:grid-cols-12 lg:items-center">
            <div className="text-center lg:col-span-4 lg:text-left">
              <Eyebrow>Google rating</Eyebrow>
              <p className="mt-4 font-display text-6xl leading-none text-gradient-gold sm:text-7xl">
                {site?.rating ?? "—"}
              </p>
              <div className="mt-4 flex justify-center lg:justify-start">
                <Stars rating={5} className="scale-110" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {site?.ratingCount != null
                  ? `Based on ${site.ratingCount} reviews`
                  : "Google reviews"}
              </p>
            </div>

            <ul className="space-y-3 lg:col-span-5">
              {BREAKDOWN.map((row) => (
                <li key={row.stars} className="flex items-center gap-4">
                  <span className="w-10 shrink-0 text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {row.stars} ★
                  </span>
                  <span className="h-1 flex-1 bg-foreground/10">
                    <span
                      className="block h-full bg-[var(--gradient-gold)]"
                      style={{ width: `${row.share}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-[0.66rem] tabular-nums text-muted-foreground">
                    {row.share}%
                  </span>
                </li>
              ))}
            </ul>

            <div className="lg:col-span-3 lg:text-right">
              {mapsLink ? (
                <ButtonAnchor href={mapsLink} variant="outline">
                  Write a review
                </ButtonAnchor>
              ) : null}
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            eyebrow="In their words"
            title="Eight reviews, unedited"
            intro="Bridal purchases, gold exchange, repairs, first-time buying — a fair spread of why people walk in."
          />
          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((item) => (
              <RevealItem key={item.name} className="h-full">
                <TestimonialCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <CtaSection
        eyebrow="Your turn"
        title="Come and form your own opinion"
        body="Bring a photograph, a budget, or nothing at all. There is no obligation to buy on a first visit and we will not treat you as though there is."
      />
    </>
  );
}
