import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { buttonClasses, type ButtonVariant } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

/* ── Type & rules ──────────────────────────────────────────── */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function GoldRule({ className }: { className?: string }) {
  return <span aria-hidden className={cn("rule-gold block w-16", className)} />;
}

/** Gold hairline with a centred lozenge — the divider used between sections. */
export function AssayDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center justify-center gap-3", className)}>
      <span className="rule-gold w-12 sm:w-20" />
      <span className="h-1.5 w-1.5 rotate-45 bg-primary" />
      <span className="rule-gold w-12 sm:w-20" />
    </div>
  );
}

/**
 * SIGNATURE ELEMENT — hallmark corner ticks.
 * Four hairline gold L-marks, the way an assay certificate frames its content.
 */
export function HallmarkFrame({
  children,
  className,
  inset = "1rem",
}: {
  children: ReactNode;
  className?: string;
  inset?: string;
}) {
  const corner =
    "pointer-events-none absolute h-5 w-5 border-brand/45 transition-all duration-500 group-hover:h-7 group-hover:w-7 group-hover:border-brand/80";
  return (
    <div className={cn("group relative", className)}>
      <span
        aria-hidden
        className={cn(corner, "border-l border-t")}
        style={{ top: inset, left: inset }}
      />
      <span
        aria-hidden
        className={cn(corner, "border-r border-t")}
        style={{ top: inset, right: inset }}
      />
      <span
        aria-hidden
        className={cn(corner, "border-b border-l")}
        style={{ bottom: inset, left: inset }}
      />
      <span
        aria-hidden
        className={cn(corner, "border-b border-r")}
        style={{ bottom: inset, right: inset }}
      />
      {children}
    </div>
  );
}

/* ── Layout ────────────────────────────────────────────────── */

export function Section({
  children,
  className,
  id,
  tone = "ink",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "ink" | "surface" | "vignette";
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-x-clip px-5 py-20 sm:py-24 lg:py-28",
        tone === "surface" && "bg-surface",
        tone === "vignette" && "vignette-top",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "center",
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  align?: "center" | "left";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        action && "lg:flex-row lg:items-end lg:justify-between lg:text-left",
        className,
      )}
    >
      <div
        className={cn(
          "flex max-w-3xl flex-col gap-4",
          align === "center" && !action && "items-center",
        )}
      >
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-balance text-3xl leading-[1.12] text-foreground sm:text-4xl lg:text-[2.9rem]">
          {title}
        </h2>
        <GoldRule className={cn(align === "center" && !action && "self-center")} />
        {intro ? (
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {intro}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ── Buttons ───────────────────────────────────────────────── */

export function ButtonLink({
  to,
  children,
  variant = "gold",
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link to={to} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  href,
  children,
  variant = "gold",
  className,
  external = true,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "className" | "children">) {
  return (
    <a
      href={href}
      className={buttonClasses(variant, className)}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

/* ── Bits ──────────────────────────────────────────────────── */

export function Stars({ rating = 5, className }: { rating?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={cn("h-3.5 w-3.5", i < rating ? "fill-brand text-brand" : "text-foreground/20")}
        />
      ))}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-brand/30 bg-primary/10 px-3.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-brand",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
