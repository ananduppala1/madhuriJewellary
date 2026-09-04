import { MessageCircle } from "lucide-react";
import { faqGroups } from "@/data/content";
import { useSite } from "@/context/SiteSettingsContext";
import { faqSchema, Seo } from "@/lib/seo";
import { CtaSection } from "@/components/sections";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import {
  ButtonAnchor,
  Container,
  JsonLd,
  Section,
  SectionHeading,
} from "@/components/ui-kit/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ALL_ITEMS = faqGroups.flatMap((group) => group.items);

export function FaqsPage() {
  const { whatsappLink } = useSite();
  const questionEnquiry = whatsappLink("Hello Madhuri Jewellers, I have a question:");

  return (
    <>
      <Seo
        title="FAQs — Hallmarking, Making Charges, Exchange & Repairs | Madhuri Jewellers"
        description="Answers on BIS hallmarking and HUID, 22K vs 18K, how making charges are calculated, old gold exchange, buyback and repairs at Madhuri Jewellers, Secunderabad."
        path="/faqs"
      />
      <JsonLd data={faqSchema(ALL_ITEMS)} />

      <PageHero
        eyebrow="Before you visit"
        title="Frequently Asked Questions"
        line="Purity, pricing, exchange and repairs — answered plainly."
        intro="If something here is still unclear, message us. We would rather answer a question twice than have you walk in unsure about what you are paying for."
        image="temple"
        trail={[
          { label: "Home", path: "/" },
          { label: "FAQs", path: "/faqs" },
        ]}
      />

      <Section>
        <Container className="max-w-4xl">
          {faqGroups.map((group, groupIndex) => (
            <Reveal key={group.group} delay={groupIndex * 0.05} className="mb-14 last:mb-0">
              <h2 className="eyebrow">{group.group}</h2>
              <Accordion type="single" collapsible className="mt-5">
                {group.items.map((item, index) => (
                  <AccordionItem
                    key={item.q}
                    value={`${groupIndex}-${index}`}
                    className="border-b border-border"
                  >
                    <AccordionTrigger className="py-5 text-left font-display text-lg text-foreground hover:text-brand hover:no-underline sm:text-xl">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          ))}
        </Container>
      </Section>

      <Section tone="surface" className="py-16">
        <Container>
          <SectionHeading
            eyebrow="Still unsure?"
            title="Ask us directly"
            intro="A message on WhatsApp reaches the counter, not a call centre. We usually reply within the hour during store hours."
          />
          <div className="mt-10 flex justify-center">
            {questionEnquiry ? (
              <ButtonAnchor href={questionEnquiry}>
                <MessageCircle aria-hidden className="h-4 w-4" /> Ask on WhatsApp
              </ButtonAnchor>
            ) : null}
          </div>
        </Container>
      </Section>

      <CtaSection />
    </>
  );
}
