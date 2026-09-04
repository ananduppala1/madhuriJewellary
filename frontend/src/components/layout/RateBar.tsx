import { useGoldRates } from "@/lib/gold-rates";

export function RateBar() {
  const { rates, failed } = useGoldRates();

  return (
    <div className="on-dark relative border-b border-border bg-secondary py-2.5 text-secondary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.62rem] uppercase tracking-[0.24em]">
          <span className="text-brand">Today's Rate</span>
          {rates ? (
            <>
              <RateItem label="22K" value={rates.gold22k} />
              <RateItem label="24K" value={rates.gold24k} />
              <RateItem label="Silver" value={rates.silver} />
            </>
          ) : (
            <span className="normal-case tracking-normal text-muted-foreground">
              {failed ? "Rate unavailable right now — call the store" : "Loading today's rate…"}
            </span>
          )}
        </div>

        <div className="hidden items-center gap-2.5 text-[0.6rem] uppercase tracking-[0.22em] text-foreground/85 sm:flex">
          <span>BIS Hallmarked</span>
          <span aria-hidden className="h-1 w-1 rotate-45 bg-primary" />
          <span>Transparent Making Charges</span>
        </div>
      </div>
    </div>
  );
}

function RateItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="normal-case tracking-normal text-foreground">
        ₹{value.toLocaleString("en-IN")}/g
      </span>
    </span>
  );
}
