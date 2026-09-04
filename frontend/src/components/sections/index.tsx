import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Clock,
  Hammer,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { craftSteps, stats, testimonials, whyChooseUs, type Testimonial } from "@/data/content";
import { imagery, type ImageKey } from "@/data/images";
import { useSite } from "@/context/SiteSettingsContext";
import { assetImage, remoteImage } from "@/lib/media";
import type { CollectionSummary } from "@/types/api";
import { cn } from "@/lib/utils";
import { MissingImage, TextSkeleton } from "@/components/ui-kit/AsyncStates";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui-kit/Reveal";
import {
  AssayDivider,
  ButtonAnchor,
  ButtonLink,
  Container,
  Eyebrow,
  HallmarkFrame,
  Pill,
  Section,
  SectionHeading,
  Stars,
} from "@/components/ui-kit/primitives";

const ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Scale,
  Hammer,
  RefreshCw,
  Sparkles,
  HeartHandshake,
};

/* ── Stats ─────────────────────────────────────────────────── */

export function StatsBar() {
  return (
    <section className="border-y border-brand/15 bg-surface">
      <Container className="grid grid-cols-2 gap-y-10 px-5 py-12 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-2 text-center">
            <p className="font-display text-3xl text-gradient-gold sm:text-4xl">{stat.value}</p>
            <p className="mt-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </Container>
    </section>
  );
}

const TICKER_ITEMS = [
  "In-house karigars since 2004",
  "Custom designs in 15 days",
  "BIS hallmarked 22K gold",
  "Transparent making charges",
];

export function TrustTicker() {
  return (
    <div className="relative overflow-hidden border-b border-border bg-secondary py-2.5">
      <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex gap-12">
            {TICKER_ITEMS.map((text) => (
              <span
                key={text}
                className="flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.28em] text-brand"
              >
                <span className="h-1 w-1 rotate-45 bg-primary" />
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Category grid ─────────────────────────────────────────── */

export function CategoryCard({
  collection,
  featured = false,
  fill = false,
}: {
  collection: CollectionSummary;
  /** Larger heading — the bento grid's one enlarged tile. */
  featured?: boolean;
  /** Fill the grid cell's own height (bento layouts, which set explicit row heights) instead of the fixed portrait aspect used everywhere else. */
  fill?: boolean;
}) {
  return (
    <Link
      to={collection.path}
      className={cn(
        "group relative block overflow-hidden border border-border",
        fill ? "aspect-[4/3] sm:aspect-auto sm:h-full" : "aspect-[3/4]",
      )}
    >
      {/* A collection with no banner uploaded shows an honest gap rather than
          another collection's photograph under this one's name. */}
      {remoteImage(collection.banner, { width: 900 }) ? (
        <img
          src={remoteImage(collection.banner, { width: 900 }) ?? ""}
          alt={`${collection.name} at Madhuri Jewellers, Secunderabad`}
          width={900}
          height={1100}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
      ) : (
        <MissingImage className="h-full w-full border-0" label="" />
      )}
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,6,0)_35%,rgba(20,14,6,0.55)_70%,rgba(16,11,4,0.92)_100%)]"
      />
      <HallmarkFrame className="on-dark absolute inset-0" inset="0.75rem">
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
          <span className="eyebrow">{collection.eyebrow}</span>
          <span
            className={cn(
              "font-display leading-tight text-foreground transition-colors group-hover:text-brand",
              featured ? "text-2xl sm:text-3xl" : "text-2xl",
            )}
          >
            {collection.name}
          </span>
          <span className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-foreground/75">
            View collection
            <ArrowUpRight
              aria-hidden
              className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          </span>
        </span>
      </HallmarkFrame>
    </Link>
  );
}

export function CategoryGrid({
  collections: list,
  className,
}: {
  collections: CollectionSummary[];
  className?: string;
}) {
  return (
    <RevealGroup className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {list.map((collection) => (
        <RevealItem key={collection.path}>
          <CategoryCard collection={collection} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/**
 * Same card content and data as CategoryGrid, laid out as a bento: the first
 * collection takes a large featured tile, the rest fill in around it. Built
 * for exactly six items — the homepage's featured six — not a general list.
 */
export function CategoryBentoGrid({
  collections: list,
  className,
}: {
  collections: CollectionSummary[];
  className?: string;
}) {
  const [featured, ...rest] = list;
  if (!featured) return null;

  return (
    <RevealGroup
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-3 sm:[grid-auto-rows:15rem] lg:[grid-auto-rows:16.5rem]",
        className,
      )}
    >
      <RevealItem className="sm:col-span-2 sm:row-span-2">
        <CategoryCard collection={featured} featured fill />
      </RevealItem>
      {rest.map((collection) => (
        <RevealItem key={collection.path}>
          <CategoryCard collection={collection} fill />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/* ── Why choose us ─────────────────────────────────────────── */

export function WhyChooseUs() {
  return (
    <Section tone="surface">
      <Container>
        <SectionHeading
          eyebrow="Why Madhuri"
          title="Six reasons families keep coming back"
          intro="Nothing here is a slogan. Each one is a practice you can hold us to on your next visit."
        />
        <RevealGroup className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <RevealItem key={item.title} className="h-full">
                <div className="group h-full bg-card p-8 transition-colors duration-500 hover:bg-secondary/60">
                  <Icon
                    aria-hidden
                    className="h-6 w-6 text-brand transition-transform duration-500 group-hover:scale-110"
                  />
                  <h3 className="mt-5 font-display text-xl text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}

/* ── Craftsmanship ─────────────────────────────────────────── */

export function Craftsmanship() {
  return (
    <Section>
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal direction="right">
          <HallmarkFrame inset="1.25rem">
            <img
              src={imagery.temple}
              alt="A karigar finishing hand-repoussé temple work at the Madhuri Jewellers bench"
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full border border-border object-cover"
            />
          </HallmarkFrame>
        </Reveal>

        <div>
          <Eyebrow>At the bench</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl lg:text-[2.7rem]">
            Five steps between bullion and the box
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Repoussé, kundan setting, enamelling and finishing all happen in our own workshop. It is
            slower than ordering from a wholesaler — and it is the reason we can change a design to
            suit your face instead of telling you what is in stock.
          </p>

          <ol className="mt-10 space-y-6">
            {craftSteps.map((step, index) => (
              <Reveal key={step.step} delay={index * 0.06} className="flex gap-5">
                <span className="mt-1 font-display text-sm text-brand tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 border-b border-border pb-5">
                  <span className="block font-display text-lg text-foreground">{step.step}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/* ── Testimonials ──────────────────────────────────────────── */

export function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="flex h-full flex-col surface-card p-7 transition-all duration-500 hover:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={item.rating} />
        <Pill>{item.occasion}</Pill>
      </div>
      <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground/85">
        “{item.body}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand/30 font-display text-sm text-brand">
          {item.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-foreground">{item.name}</span>
          <span className="block text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
            {item.location} · {item.date}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection({ limit = 3 }: { limit?: number }) {
  const { site } = useSite();

  // The rating is the shop's to publish, so the sentence adapts rather than
  // quoting a number the backend has not confirmed.
  const intro =
    site?.rating != null && site.ratingCount != null
      ? `${site.rating} out of 5 across ${site.ratingCount} Google reviews, most of them written by people who live within three kilometres of the shop.`
      : "Reviews written by people who live within three kilometres of the shop.";

  return (
    <Section tone="surface">
      <Container>
        <SectionHeading
          eyebrow="In their words"
          title="Reviewed by the families next door"
          intro={intro}
          action={
            <ButtonLink to="/testimonials" variant="outline">
              Read all reviews
            </ButtonLink>
          }
        />
        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, limit).map((item) => (
            <RevealItem key={item.name} className="h-full">
              <TestimonialCard item={item} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

/* ── Google rating ─────────────────────────────────────────── */

export function GoogleRating() {
  const { site, mapsLink, loading } = useSite();

  return (
    <Section className="py-16 sm:py-20">
      <Container>
        <Reveal className="flex flex-col items-center gap-6 border border-brand/25 surface-card px-6 py-12 text-center">
          <Eyebrow>Google Business Profile</Eyebrow>
          <p className="font-display text-6xl leading-none text-gradient-gold sm:text-7xl">
            {site?.rating ?? (loading ? <TextSkeleton className="h-12 w-24" /> : "—")}
          </p>
          <Stars rating={5} className="scale-125" />
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {site?.ratingCount != null
              ? `Rated by ${site.ratingCount} customers across bridal purchases, gold exchange, repairs and everyday buying. We read every one of them.`
              : "Rated across bridal purchases, gold exchange, repairs and everyday buying. We read every one of them."}
          </p>
          {mapsLink ? (
            <ButtonAnchor href={mapsLink} variant="outline">
              View us on Google
            </ButtonAnchor>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}

/* ── Instagram ─────────────────────────────────────────────── */

const FEED: { image: ImageKey; caption: string }[] = [
  { image: "bridal", caption: "A guttapusalu set leaving for a Sankranti wedding" },
  { image: "temple", caption: "Lakshmi coins, struck and waiting to be strung" },
  { image: "bangles", caption: "Broad kadas, fresh off the polishing wheel" },
  { image: "antique", caption: "Chandbali with a pearl fringe" },
  { image: "lightweight", caption: "Under fifteen grams, and it still reads full" },
  { image: "store", caption: "Evening on Vinayak Nagar X Road" },
];

export function InstagramFeed() {
  const { site } = useSite();
  const instagram = site?.instagram ?? null;

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="@madhuri_jewellers2024"
          title="New pieces, posted as they finish"
          intro="We photograph most designs the day they come off the bench. If something catches your eye, message us and we will hold it."
          action={
            instagram ? (
              <ButtonAnchor href={instagram} variant="outline">
                <Instagram aria-hidden className="h-4 w-4" /> Follow us
              </ButtonAnchor>
            ) : null
          }
        />
        <RevealGroup className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FEED.map((post, index) => (
            <RevealItem key={`${post.image}-${index}`}>
              {/* These six plates are bundled marketing artwork, not catalogue
                  data, so they stay static. Only the link is admin-managed. */}
              <a
                {...(instagram
                  ? { href: instagram, target: "_blank", rel: "noreferrer" }
                  : { "aria-disabled": true })}
                className="group relative block aspect-square overflow-hidden border border-border"
                aria-label={`Instagram: ${post.caption}`}
              >
                <img
                  src={assetImage(post.image)}
                  alt={post.caption}
                  width={600}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-[rgba(16,11,4,0.55)] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Instagram aria-hidden className="h-5 w-5 text-[#f5e7b2]" />
                </span>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

/* ── Location ──────────────────────────────────────────────── */

export function LocationSection() {
  const {
    site,
    phones,
    hours,
    addressLine,
    addressCity,
    mapsLink,
    mapsEmbed,
    telLink,
    whatsappLink,
  } = useSite();
  const visitEnquiry = whatsappLink("Hello Madhuri Jewellers, I'd like to visit the store.");

  return (
    <Section tone="surface">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>Find us</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl">
            Vinayak Nagar X Road, Old Neredmet
          </h2>
          <AssayDivider className="mt-6 max-w-xs justify-start" />

          <ul className="mt-8 space-y-6 text-sm">
            <li className="flex gap-4">
              <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <span className="text-muted-foreground">
                {addressLine ? (
                  <>
                    {addressLine}
                    <br />
                    {addressCity}
                    <br />
                  </>
                ) : (
                  <>
                    <TextSkeleton className="w-52" />
                    <br />
                  </>
                )}
                <span className="text-foreground/70">
                  On the main road, parking directly outside, five minutes from Safilguda station.
                </span>
              </span>
            </li>
            <li className="flex gap-4">
              <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <span className="text-muted-foreground">
                {hours.length > 0 ? (
                  hours.map((row) => (
                    <span key={row.days} className="block">
                      {row.days} — <span className="text-foreground/85">{row.time}</span>
                    </span>
                  ))
                ) : (
                  <TextSkeleton className="w-56" />
                )}
              </span>
            </li>
            <li className="flex gap-4">
              <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <span className="flex flex-col gap-1">
                {phones.length > 0 ? (
                  phones.map((phone) => (
                    <a
                      key={phone}
                      href={telLink(phone)}
                      className="text-muted-foreground transition-colors hover:text-brand"
                    >
                      +91 {phone}
                    </a>
                  ))
                ) : (
                  <TextSkeleton className="w-28" />
                )}
              </span>
            </li>
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            {mapsLink ? <ButtonAnchor href={mapsLink}>Get directions</ButtonAnchor> : null}
            {visitEnquiry ? (
              <ButtonAnchor href={visitEnquiry} variant="outline">
                <MessageCircle aria-hidden className="h-4 w-4" /> Message us
              </ButtonAnchor>
            ) : null}
          </div>
        </div>

        <Reveal direction="left" className="border border-border">
          {mapsEmbed ? (
            <iframe
              title={`Map showing ${site?.name ?? "the store"} in Old Neredmet, Secunderabad`}
              src={mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[22rem] w-full grayscale-[0.4] contrast-[1.1]"
            />
          ) : (
            <span aria-hidden className="block h-full min-h-[22rem] w-full bg-border/30" />
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

/* ── CTA ───────────────────────────────────────────────────── */

export function CtaSection({
  eyebrow = "Visit the showroom",
  title = "Come see it in daylight",
  body = "Photographs flatten gold. Walk in, hold the piece, watch it weighed — and take the decision with everything in front of you.",
  image = "store",
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  image?: ImageKey;
}) {
  const { whatsappLink } = useSite();
  const visitEnquiry = whatsappLink("Hello Madhuri Jewellers, I'd like to book a visit.");

  return (
    <section className="relative isolate overflow-hidden border-y border-border bg-secondary">
      <img
        src={assetImage(image)}
        alt=""
        aria-hidden
        width={1600}
        height={1000}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,236,221,0.82),rgba(244,236,221,0.94))]"
      />
      <Container className="relative px-5 py-24 sm:py-28">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="text-balance font-display text-3xl leading-[1.1] text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <AssayDivider className="w-full max-w-sm" />
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {body}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {visitEnquiry ? (
              <ButtonAnchor href={visitEnquiry}>
                <MessageCircle aria-hidden className="h-4 w-4" /> Book a visit
              </ButtonAnchor>
            ) : null}
            <ButtonLink to="/contact" variant="outline">
              Contact & directions
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
