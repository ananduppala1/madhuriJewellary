import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { bannerImage } from "@/lib/media";
import { breadcrumbSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { AssayDivider, Container, Eyebrow, JsonLd } from "./primitives";

export type Crumb = { label: string; path: string };

export function Breadcrumbs({ trail, className }: { trail: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center justify-center gap-1.5 text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight aria-hidden className="h-3 w-3 text-brand" /> : null}
              {isLast ? (
                <span aria-current="page" className="text-brand">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className="transition-colors hover:text-brand">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Ivory banner. The collection photograph sits far back at low opacity so the
 * page still reads as paper — the dark treatment is reserved for the home hero,
 * the CTA band and the footer.
 */
export function PageHero({
  eyebrow,
  title,
  line,
  intro,
  image,
  trail,
  children,
}: {
  eyebrow: string;
  title: string;
  line?: string;
  intro?: string;
  /** A bundled asset key for static pages, or a Cloudinary URL from the API. */
  image?: string | null;
  trail: Crumb[];
  children?: ReactNode;
}) {
  /**
   * The `fallbackImage` prop is gone. It existed so a collection with no banner
   * borrowed the bridal photograph — which put one collection's photography
   * behind another collection's name. The banner sits at 16% opacity behind a
   * near-opaque gradient, so leaving it out changes almost nothing visually and
   * removes the misattribution entirely.
   */
  const banner = bannerImage(image, { width: 1600 });

  return (
    <header className="relative isolate overflow-hidden border-b border-border bg-secondary">
      {banner ? (
        <img
          src={banner}
          alt=""
          aria-hidden
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.16]"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(251,247,240,0.78)_0%,rgba(251,247,240,0.9)_55%,var(--background)_100%)]"
      />
      <div aria-hidden className="absolute inset-0 vignette-top" />

      <Container className="relative px-5 pb-16 pt-12 sm:pb-20 sm:pt-14">
        <Breadcrumbs trail={trail} />
        <Reveal className="mt-9 flex flex-col items-center gap-5 text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-balance font-display text-4xl leading-[1.04] text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {line ? (
            <p className="max-w-2xl text-pretty text-base text-brand sm:text-lg">{line}</p>
          ) : null}
          <AssayDivider className="my-1 w-full max-w-md" />
          {intro ? (
            <p className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {intro}
            </p>
          ) : null}
          {children}
        </Reveal>
      </Container>
      <JsonLd data={breadcrumbSchema(trail)} />
    </header>
  );
}
