import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { prefetchProduct } from "@/api";
import { remoteImage } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";
import { MissingImage } from "@/components/ui-kit/AsyncStates";
import { RevealGroup, RevealItem } from "@/components/ui-kit/Reveal";

/** The image the card leads with: primary if one is flagged, else the first. */
function coverImage(product: Product) {
  return product.images.find((image) => image.isPrimary) ?? product.images[0];
}

export function ProductCard({
  product,
  collectionName,
  priority = false,
}: {
  product: Product;
  collectionName: string;
  priority?: boolean;
}) {
  const cover = coverImage(product);
  const label = product.collection?.name ?? collectionName;
  const src = remoteImage(cover?.url, { width: 900 });

  /**
   * Hovering a card asks the API for the piece the visitor is about to open.
   * Nothing is stored in the browser — the point is to turn what would be a
   * cache miss on the detail page into a Redis hit before the click lands. It
   * fires once per piece per session and only on a deliberate hover.
   */
  const prefetch = () => prefetchProduct(product.slug);

  return (
    <article
      className="group relative flex h-full flex-col surface-card transition-all duration-500 hover:shadow-lift"
      onPointerEnter={prefetch}
      onFocusCapture={prefetch}
    >
      <Link
        to={`/product/${product.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative aspect-[4/5] overflow-hidden bg-muted"
      >
        {/* The image box keeps its 4:5 ratio whether or not a photograph
            exists, so a product without one leaves the grid exactly as it is
            instead of collapsing the row. */}
        {src ? (
          <img
            src={src}
            alt={
              cover?.alt ??
              `${product.name} — ${product.purity ?? label} at Madhuri Jewellers, Secunderabad`
            }
            width={900}
            height={1100}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            {...(priority ? { fetchPriority: "high" as const } : {})}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <MissingImage className="h-full w-full border-0" />
        )}
        {product.badge ? (
          <span className="absolute left-0 top-4 bg-primary px-3.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground">
            {product.badge}
          </span>
        ) : null}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-px w-0 bg-[var(--gradient-gold)] transition-all duration-700 group-hover:w-full"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="text-[0.58rem] uppercase tracking-[0.24em] text-brand">{product.purity}</p>
        <h3 className="font-display text-xl leading-snug text-foreground transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-[0.68rem]">
          <div>
            <dt className="uppercase tracking-[0.16em] text-muted-foreground">Weight range</dt>
            <dd className="mt-1 text-foreground/90">{product.weight}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.16em] text-muted-foreground">Availability</dt>
            <dd className="mt-1 text-foreground/90">{product.designs}</dd>
          </div>
        </dl>

        <Link
          to={`/product/${product.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <span className="absolute inset-0" aria-hidden />
          View Product
          <span className="sr-only">: {product.name}</span>
          <ArrowUpRight
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  collectionName,
  className,
  columns = 3,
}: {
  products: Product[];
  collectionName: string;
  className?: string;
  columns?: 3 | 4;
}) {
  return (
    <RevealGroup
      className={cn(
        "grid gap-6 sm:grid-cols-2",
        columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <RevealItem key={product.slug} className="h-full">
          <ProductCard product={product} collectionName={collectionName} priority={index < 3} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
