import { Check } from "lucide-react";
import { missionVision, storyParagraphs, trustPoints } from "@/data/content";
import { imagery } from "@/data/images";
import { Seo } from "@/lib/seo";
import { Craftsmanship, CtaSection, StatsBar, WhyChooseUs } from "@/components/sections";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui-kit/Reveal";
import {
  AssayDivider,
  Container,
  Eyebrow,
  HallmarkFrame,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

const STORE_IMAGES = [
  { key: "store" as const, caption: "The main hall, Vinayak Nagar X Road" },
  { key: "bridal" as const, caption: "The bridal room, set for an appointment" },
  { key: "temple" as const, caption: "Repoussé work at the bench" },
];

export function AboutPage() {
  return (
    <>
      <Seo
        title="About Madhuri Jewellers — Family Jewellers in Secunderabad Since 2004"
        description="The story behind Madhuri Jewellers: our own karigars, hallmarked purity, printed making charges and twenty years on Vinayak Nagar X Road, Old Neredmet, Malkajgiri."
        path="/about"
      />

      <PageHero
        eyebrow="Our story"
        title="About Madhuri Jewellers"
        line="Twenty years on the same road, behind the same counter."
        intro="We are not a chain. We are a family jewellery house in Old Neredmet with our own workshop, our own karigars, and a rule about transparency we have never had reason to change."
        image="store"
        trail={[
          { label: "Home", path: "/" },
          { label: "About", path: "/about" },
        ]}
      />

      <StatsBar />

      {/* Story */}
      <Section>
        <Container className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal direction="right">
              <HallmarkFrame inset="1.25rem">
                <img
                  src={imagery.store}
                  alt="Inside Madhuri Jewellers, Old Neredmet, Secunderabad"
                  width={1600}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full border border-border object-cover"
                />
              </HallmarkFrame>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Eyebrow>How it started</Eyebrow>
            <h2 className="mt-4 text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl">
              One glass case, two karigars, and a rule about the scale
            </h2>
            <AssayDivider className="my-7 max-w-xs justify-start" />
            <div className="space-y-5">
              {storyParagraphs.map((paragraph, index) => (
                <Reveal key={index} delay={index * 0.08}>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Mission & vision */}
      <Section tone="surface">
        <Container>
          <RevealGroup className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            {missionVision.map((item) => (
              <RevealItem key={item.title} className="h-full">
                <div className="h-full bg-card p-9 sm:p-12">
                  <Eyebrow>{item.title}</Eyebrow>
                  <p className="mt-6 font-display text-xl leading-relaxed text-foreground/90 sm:text-2xl">
                    {item.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Craftsmanship />

      {/* Trust */}
      <Section tone="surface">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>Why customers trust us</Eyebrow>
            <h2 className="mt-4 text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl">
              Six things you can hold us to
            </h2>
            <AssayDivider className="my-7 max-w-xs justify-start" />
            <ul className="space-y-4">
              {trustPoints.map((point, index) => (
                <Reveal key={point} delay={index * 0.05} as="li" className="flex gap-4">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-sm leading-relaxed text-muted-foreground">{point}</span>
                </Reveal>
              ))}
            </ul>
          </div>

          <RevealGroup className="grid grid-cols-2 gap-4">
            {STORE_IMAGES.map((item, index) => (
              <RevealItem key={item.caption} className={index === 0 ? "col-span-2" : undefined}>
                <figure className="group overflow-hidden border border-border">
                  <img
                    src={imagery[item.key]}
                    alt={item.caption}
                    width={1600}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    className={
                      index === 0
                        ? "aspect-[16/9] w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                        : "aspect-[4/5] w-full object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                    }
                  />
                  <figcaption className="border-t border-border bg-card px-4 py-3 text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {item.caption}
                  </figcaption>
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <WhyChooseUs />

      <Section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="Experience"
            title="What twenty years actually buys you"
            intro="Not a slogan — a set of things a newer shop simply cannot offer yet."
          />
          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Designs we can alter",
                body: "Because the bench is ours, a haaram can be shortened, a jhumka lightened, or a motif swapped — without reordering from a wholesaler.",
              },
              {
                title: "Repairs nobody else takes",
                body: "Forty-year-old screw bangles, snapped kundan settings, worn clasps. We have the tools and the patience for old work.",
              },
              {
                title: "Advice with nothing behind it",
                body: "If 18K suits a design better than 22K, we say so — even when 22K would bill higher. The relationship outlasts the invoice.",
              },
            ].map((item) => (
              <RevealItem key={item.title} className="h-full">
                <div className="h-full surface-card p-8">
                  <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <CtaSection
        eyebrow="Come and see"
        title="The shop is five minutes from Safilguda station"
        body="Walk in any day of the week. No appointment needed unless you are buying bridal — for that, book so the private room and a senior karigar are free."
      />
    </>
  );
}
