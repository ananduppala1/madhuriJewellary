import { cn } from "@/lib/utils";

const buttonBase =
  "relative inline-flex items-center justify-center gap-2.5 overflow-hidden px-7 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-all duration-500 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  /** Filled — deep bronze on ivory, bright gold on ink. */
  gold: "bg-primary text-primary-foreground hover:bg-brand shadow-soft hover:shadow-gold",
  /** Hairline outline that fills on hover. */
  outline:
    "border border-brand/45 text-brand hover:border-brand hover:bg-primary hover:text-primary-foreground",
  /** Quiet outline for use over photography — frosted so it stays legible on any image. */
  ghost:
    "border border-current/30 bg-background/70 text-foreground shadow-soft backdrop-blur-md hover:border-brand hover:bg-primary hover:text-primary-foreground",
  /** Inverted — for light CTAs sitting on a dark band. */
  dark: "bg-foreground text-background hover:bg-primary hover:text-primary-foreground",
} as const;

export type ButtonVariant = keyof typeof variants;

/** Shared button styling for <Link>, <a> and <button> so every CTA matches. */
export function buttonClasses(variant: ButtonVariant = "gold", className?: string | undefined) {
  return cn(buttonBase, variants[variant], className);
}
