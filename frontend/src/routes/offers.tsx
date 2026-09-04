import { MessageCircle } from "lucide-react";
import { offers } from "@/data/content";
import { useSite } from "@/context/SiteSettingsContext";
import { Seo } from "@/lib/seo";
import { CtaSection, GoogleRating } from "@/components/sections";
import { PageHero } from "@/components/ui-kit/PageHero";
import { RevealGroup, RevealItem } from "@/components/ui-kit/Reveal";
import {
  ButtonAnchor,
  Container,
  Pill,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";

export function OffersPage() {
  const { whatsappLink } = useSite();
  const offerEnquiry = whatsappLink(
    "Hello Madhuri Jewellers, I'd like to know more about your current offers and the savings scheme.",
  );

  return (
    <>
      <Seo
        title="Offers, Gold Savings Scheme & Exchange | Madhuri Jewellers Secunderabad"
        description="Current offers at Madhuri Jewellers — bridal making charge waivers, the eleven-month gold savings plan, zero-deduction exchange and free solitaire maintenance."
        path="/offers"
      />
      <PageHero
        eyebrow="Current offers"
        title="Offers & Schemes"
        line="Written down, with the terms in plain language."
        intro="We do not run permanent discounts — the making charge is what it is. What we do run is a savings plan, seasonal waivers on bridal work, and a fair exchange window. Everything here is honoured at the counter without an argument."
        image="antique"
        trail={[
          { label: "Home", path: "/" },
          { label: "Offers", path: "/offers" },
        ]}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Running now"
            title="Six things worth asking about"
            intro="Mention any of these at the counter. If an offer has ended, we will tell you rather than quietly leaving it on the website."
          />

          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2">
            {offers.map((offer) => (
              <RevealItem key={offer.title} className="h-full">
                <article className="group flex h-full flex-col surface-card p-8 transition-all duration-500 hover:shadow-lift sm:p-10">
                  <Pill className="self-start">{offer.tag}</Pill>
                  <h3 className="mt-6 font-display text-2xl leading-snug text-foreground transition-colors group-hover:text-brand">
                    {offer.title}
                  </h3>
                  <p className="mt-2 text-[0.66rem] uppercase tracking-[0.2em] text-brand">
                    {offer.hook}
                  </p>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {offer.body}
                  </p>
                  <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                    {offer.terms}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-14 flex justify-center">
            {offerEnquiry ? (
              <ButtonAnchor href={offerEnquiry}>
                <MessageCircle aria-hidden className="h-4 w-4" /> Ask about an offer
              </ButtonAnchor>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="The fine print, unhidden"
            title="What we will not do"
            align="left"
          />
          <ul className="mt-12 divide-y divide-border border-y border-border">
            {[
              "Quote a discount on gold rate. The rate is set by the market and shown on the board.",
              "Add a charge after the estimate is signed. What is printed is what is billed.",
              "Assay your old gold out of your sight. The karat meter is on the counter.",
              "Sell an uncertified stone as certified. If it has no plot, we say so.",
            ].map((line) => (
              <li key={line} className="py-6 text-sm leading-relaxed text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <GoogleRating />
      <CtaSection />
    </>
  );
}
