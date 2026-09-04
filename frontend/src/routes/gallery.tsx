import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { BRAND_NAME } from "@/data/site";
import { useGallery } from "@/hooks/useCatalogue";
import { assetImage, remoteImage } from "@/lib/media";
import { useSite } from "@/context/SiteSettingsContext";
import { Seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { CtaSection } from "@/components/sections";
import {
  EmptyState,
  ErrorState,
  GalleryGridSkeleton,
  MissingImage,
} from "@/components/ui-kit/AsyncStates";
import { PageHero } from "@/components/ui-kit/PageHero";
import { Reveal } from "@/components/ui-kit/Reveal";
import { Container, Section, SectionHeading } from "@/components/ui-kit/primitives";

/** Kept in the bundle: these are UI tabs, and they match the DB category enum. */
const GALLERY_FILTERS = ["All", "Store", "Jewellery", "Craft", "Moments"] as const;
type GalleryFilter = (typeof GALLERY_FILTERS)[number];

export function GalleryPage() {
  const { site } = useSite();

  const [filter, setFilter] = useState<GalleryFilter>("All");
  const { data, loading, error, reload } = useGallery();

  // Filtering stays client-side, as it was: twelve or so items arrive in one
  // request and switching tabs should not cost a round trip.
  const visible = useMemo(() => {
    const items = data ?? [];
    return filter === "All" ? items : items.filter((item) => item.category === filter);
  }, [data, filter]);

  return (
    <>
      <Seo
        title="Gallery — Store, Jewellery & Workshop Photos | Madhuri Jewellers"
        description="Photographs of the Madhuri Jewellers showroom in Old Neredmet, our jewellery, the workshop bench and moments from the counter in Malkajgiri, Secunderabad."
        path="/gallery"
      />

      <PageHero
        eyebrow="Inside the showroom"
        title="Gallery"
        line="The shop, the bench, and what comes off it."
        intro="Photographs flatten gold — but these will at least tell you what the room looks like, how the counters are laid out, and the kind of handwork we are talking about."
        image="store"
        trail={[
          { label: "Home", path: "/" },
          { label: "Gallery", path: "/gallery" },
        ]}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Browse"
            title="Twelve views of Vinayak Nagar X Road"
            intro="Filter by what you want to see — the store itself, the jewellery, the workshop, or an ordinary day at the counter."
          />

          <div
            role="group"
            aria-label="Filter gallery"
            className="mt-12 flex flex-wrap justify-center gap-2"
          >
            {GALLERY_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={cn(
                  "border px-5 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] transition-all duration-300",
                  filter === option
                    ? "border-brand bg-primary text-primary-foreground"
                    : "border-brand/25 text-muted-foreground hover:border-brand/60 hover:text-brand",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {loading ? (
            <GalleryGridSkeleton count={8} />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} className="mt-12" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No photographs in this filter yet"
              body="We are adding to the gallery as pieces come off the bench. Try another filter, or follow us on Instagram."
              className="mt-12"
            />
          ) : (
            <div className="mt-12 grid auto-rows-[13rem] grid-cols-2 gap-4 sm:auto-rows-[15rem] lg:grid-cols-4">
              {visible.map((item, index) => (
                <motion.figure
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3) }}
                  className={cn(
                    "group relative overflow-hidden border border-border",
                    item.span === "tall" && "row-span-2",
                    item.span === "wide" && "col-span-2",
                  )}
                >
                  {remoteImage(item.url, { width: 1200 }) ? (
                    <img
                      src={remoteImage(item.url, { width: 1200 }) ?? ""}
                      alt={`${item.caption} — ${site?.name ?? BRAND_NAME}, Secunderabad`}
                      width={1200}
                      height={900}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                    />
                  ) : (
                    <MissingImage className="h-full w-full border-0" />
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,6,0)_40%,rgba(16,11,4,0.9)_100%)]"
                  />
                  <figcaption className="on-dark absolute inset-x-0 bottom-0 p-5">
                    <span className="block text-[0.58rem] uppercase tracking-[0.22em] text-brand">
                      {item.category}
                    </span>
                    <span className="mt-1.5 block text-sm text-foreground">{item.caption}</span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Video placeholder */}
      <Section tone="surface">
        <Container>
          <SectionHeading
            eyebrow="Store film"
            title="A walk through the showroom"
            intro="We are filming a short tour of the store and the workshop. It will sit here when it is ready — until then, the door is open six days a week."
          />
          <Reveal className="relative mt-12 aspect-video w-full overflow-hidden border border-brand/25">
            <img
              src={assetImage("store")}
              alt=""
              aria-hidden
              width={1600}
              height={1000}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-45"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/50 text-brand">
                <Play aria-hidden className="ml-1 h-6 w-6" />
              </span>
              <span className="text-[0.62rem] uppercase tracking-[0.28em] text-foreground/70">
                Store film — coming soon
              </span>
            </span>
          </Reveal>
        </Container>
      </Section>

      <CtaSection />
    </>
  );
}
