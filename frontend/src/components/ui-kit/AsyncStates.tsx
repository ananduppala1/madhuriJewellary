import { AlertCircle, ImageOff, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/ui-kit/primitives";

/**
 * The site used to read synchronous mock data, so nothing ever showed a gap.
 * Now that pages wait on the API, these states fill it — built from the same
 * borders, ivory surfaces and letter-spaced small caps as the rest of the site,
 * so a slow connection looks like the page settling rather than breaking.
 *
 * Every one of them holds the dimensions of the content it stands in for. That
 * is what keeps the product grid from jumping as photographs decode and what
 * lets the header reserve space for a phone number it does not have yet.
 */

/* ── skeletons ─────────────────────────────────────────────── */

function Shimmer({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse bg-border/60", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col surface-card">
      <Shimmer className="aspect-[4/5] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Shimmer className="h-2 w-24" />
        <Shimmer className="h-5 w-3/4" />
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
          <Shimmer className="h-6 w-full" />
          <Shimmer className="h-6 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: {
  count?: number;
  columns?: 3 | 4;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid gap-6 sm:grid-cols-2",
        columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Shimmer key={index} className="aspect-[3/4] w-full border border-border" />
      ))}
    </div>
  );
}

export function GalleryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden
      className="mt-12 grid auto-rows-[13rem] grid-cols-2 gap-4 sm:auto-rows-[15rem] lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <Shimmer key={index} className="h-full w-full border border-border" />
      ))}
    </div>
  );
}

/** Announce loading to assistive technology without describing the skeleton. */
export function LoadingAnnouncer({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

/* ── missing media ─────────────────────────────────────────── */

/**
 * Shown where a backend-managed photograph should be but is not.
 *
 * The site used to drop in a different piece of jewellery from the bundle when
 * a product had no image, which meant a customer could be looking at one
 * necklace captioned as another. An honest gap is better: it uses the same
 * muted surface and hairline border as the rest of the design, so it reads as
 * "not photographed yet" rather than as a broken page.
 */
export function MissingImage({
  className,
  label = "Photograph coming soon",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-border bg-muted text-center",
        className,
      )}
    >
      <ImageOff aria-hidden className="h-5 w-5 text-brand/50" />
      <span className="px-3 text-[0.56rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

/**
 * A placeholder the size of the text that will replace it, used while the site
 * settings request is in flight. It exists so removing the hardcoded phone
 * number did not introduce a layout shift when the real one arrives.
 */
export function TextSkeleton({ className }: { className?: string }) {
  return <Shimmer className={cn("inline-block h-3 w-28 align-middle", className)} />;
}

/* ── error ─────────────────────────────────────────────────── */

export function ErrorState({
  message = "We could not load this just now.",
  onRetry,
  className,
}: {
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-5 border border-brand/25 surface-card px-6 py-14 text-center",
        className,
      )}
    >
      <AlertCircle aria-hidden className="h-7 w-7 text-brand" />
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border border-brand/40 px-7 py-3 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:border-brand hover:bg-primary hover:text-primary-foreground"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Full-page variant for a route that could not load at all. */
export function PageErrorState({
  message,
  onRetry,
}: {
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <Section>
      <Container>
        <ErrorState
          message={
            message ??
            "This page could not be loaded. Please refresh, or call the store and we will help you directly."
          }
          {...(onRetry ? { onRetry } : {})}
          className="mx-auto max-w-xl"
        />
      </Container>
    </Section>
  );
}

/* ── empty ─────────────────────────────────────────────────── */

export function EmptyState({
  title = "Nothing here yet",
  body,
  className,
}: {
  title?: string;
  body?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border border-border surface-card px-6 py-16 text-center",
        className,
      )}
    >
      <PackageOpen aria-hidden className="h-7 w-7 text-brand/70" />
      <p className="font-display text-xl text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {body ??
          "We are photographing this counter at the moment. Message us on WhatsApp and we will send you what is in store today."}
      </p>
    </div>
  );
}
