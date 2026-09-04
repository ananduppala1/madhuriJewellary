import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.jpg"
      alt="Madhuri Jewellers monogram"
      width={96}
      height={96}
      className={cn("h-11 w-11 shrink-0 rounded-full object-cover", className)}
    />
  );
}

export function Wordmark({
  className,
  subtitle = "Secunderabad · Est. 2004",
  compact = false,
}: {
  className?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark className={compact ? "h-9 w-9" : "h-11 w-11"} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display tracking-[0.02em] text-foreground",
            compact ? "text-lg" : "text-xl sm:text-[1.4rem]",
          )}
        >
          Madhuri Jewellers
        </span>
        <span className="mt-1.5 text-[0.55rem] uppercase tracking-[0.32em] text-brand">
          {subtitle}
        </span>
      </span>
    </span>
  );
}
