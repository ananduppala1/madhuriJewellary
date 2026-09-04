import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type ImageKey } from "@/data/images";
import { assetImage } from "@/lib/media";
import { useSite } from "@/context/SiteSettingsContext";
import { useGoldRates } from "@/lib/gold-rates";
import { cn } from "@/lib/utils";
import { AssayDivider, ButtonAnchor, ButtonLink, Eyebrow } from "@/components/ui-kit/primitives";

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  line: string;
  image: ImageKey;
  to: string;
  cta: string;
};

const SLIDES: Slide[] = [
  {
    id: "bridal",
    eyebrow: "Wedding Season 2026",
    title: "The whole trousseau,\nplanned in one sitting",
    line: "Haaram, vaddanam, jhumkas and kadas laid out together — balanced against your saree before a single gram is billed.",
    image: "bridal",
    to: "/bridal-collection",
    cta: "See bridal sets",
  },
  {
    id: "temple",
    eyebrow: "Hand-Repoussé Nakshi",
    title: "Temple gold,\ncarved the old way",
    line: "Every Lakshmi face struck from a hand-cut die and finished with a chasing tool. No two coins in a kasu malai are identical.",
    image: "temple",
    to: "/temple-jewellery",
    cta: "Explore temple work",
  },
  {
    id: "daily",
    eyebrow: "Under Fifteen Grams",
    title: "Gold you actually\nwear on a Tuesday",
    line: "Hollow-build necklaces, hoops and chains with the presence of a heavy piece and none of the weight.",
    image: "lightweight",
    to: "/new-arrivals",
    cta: "See new arrivals",
  },
];

const AUTOPLAY_MS = 7000;

export function HeroSlider() {
  const { site, whatsappLink } = useSite();
  const visitEnquiry = whatsappLink("Hello Madhuri Jewellers, I'd like to book a visit.");

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const { rates } = useGoldRates();

  const go = useCallback((next: number) => {
    setIndex((current) => (next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [go, index, paused, reduced]);

  const slide = SLIDES[index]!;
  const [titleLead, titleGold] = slide.title.split("\n");

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative isolate min-h-[84svh] overflow-hidden border-b border-border bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.img
          key={slide.id}
          src={assetImage(slide.image)}
          alt=""
          aria-hidden
          width={1600}
          height={1104}
          fetchPriority="high"
          decoding="async"
          initial={{ opacity: 0, scale: reduced ? 1 : 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.1 }, scale: { duration: 8, ease: "linear" } }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Dark wash so white/gold text and the stats row stay readable over any photo. */}
      <span aria-hidden className="absolute inset-0 bg-black/40" />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-full max-w-2xl bg-[linear-gradient(90deg,rgba(10,7,3,0.88)_0%,rgba(10,7,3,0.72)_32%,rgba(10,7,3,0.4)_58%,rgba(10,7,3,0)_78%)]"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(180deg,transparent,rgba(10,7,3,0.92))]"
      />
      {/* Blend into the light page background below. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,transparent,var(--background))]"
      />

      <div className="on-dark relative mx-auto flex min-h-[84svh] w-full max-w-7xl flex-col justify-center px-5 py-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
            aria-live="polite"
          >
            <Eyebrow>{slide.eyebrow}</Eyebrow>

            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem]">
              <span className="block text-foreground">{titleLead}</span>
              {titleGold ? <span className="block text-brand">{titleGold}</span> : null}
            </h1>

            <AssayDivider className="my-7 max-w-sm justify-start" />

            <p className="max-w-xl text-pretty text-sm leading-relaxed text-foreground/75 sm:text-base">
              {slide.line}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink to={slide.to}>{slide.cta}</ButtonLink>
              {visitEnquiry ? (
                <ButtonAnchor href={visitEnquiry} variant="ghost">
                  <MessageCircle aria-hidden className="h-4 w-4" /> Book an appointment
                </ButtonAnchor>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex flex-wrap items-start gap-x-10 gap-y-5 border-t border-white/10 pt-8">
          <HeroStat value="20+" label="Years in the trade" />
          {/* The stat keeps its slot whether or not the rating has arrived, so
              the row of three does not reflow under the hero copy. */}
          <HeroStat
            value={site?.rating != null ? `${site.rating}★` : "—"}
            label={
              site?.ratingCount != null ? `${site.ratingCount} Google reviews` : "Google reviews"
            }
          />
          <HeroStat
            value={rates ? `₹${rates.gold22k.toLocaleString("en-IN")}` : "—"}
            label="22K gold / gram today"
          />
        </div>

        <div className="mt-8 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <SliderButton label="Previous slide" onClick={() => go(index - 1)}>
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </SliderButton>
            <SliderButton label="Next slide" onClick={() => go(index + 1)}>
              <ChevronRight aria-hidden className="h-4 w-4" />
            </SliderButton>
          </div>

          <ul className="flex items-center gap-3">
            {SLIDES.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show slide ${i + 1}: ${item.eyebrow}`}
                  aria-current={i === index}
                  className="group flex h-6 items-center"
                >
                  <span
                    className={cn(
                      "block h-px transition-all duration-500",
                      i === index
                        ? "w-14 bg-[var(--gradient-gold)]"
                        : "w-7 bg-foreground/25 group-hover:bg-primary/60",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>

          <span className="ml-auto hidden font-display text-sm tabular-nums text-muted-foreground sm:block">
            <span className="text-brand">{String(index + 1).padStart(2, "0")}</span>
            <span className="mx-2 text-foreground/20">/</span>
            {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl text-foreground sm:text-3xl">{value}</p>
      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}

function SliderButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center border border-brand/30 text-brand transition-all duration-300 hover:border-brand hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}
