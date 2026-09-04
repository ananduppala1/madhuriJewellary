import type { ImageKey } from "@/data/images";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import { Container, Section } from "@/components/ui-kit/primitives";

export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] };

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  image,
  path,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  image: ImageKey;
  path: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        line={`Last updated ${updated}`}
        intro={intro}
        image={image}
        trail={[
          { label: "Home", path: "/" },
          { label: title, path },
        ]}
      />

      <Section>
        <Container className="max-w-3xl">
          {sections.map((section, index) => (
            <Reveal key={section.heading} delay={index * 0.04} className="mb-12 last:mb-0">
              <h2 className="font-display text-2xl text-foreground sm:text-[1.75rem]">
                <span className="mr-3 text-sm tabular-nums text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets ? (
                <ul className="mt-5 space-y-2.5">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-primary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Reveal>
          ))}
        </Container>
      </Section>
    </>
  );
}
