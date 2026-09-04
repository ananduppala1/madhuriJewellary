import { useEffect, useState } from "react";

export type GoldRates = {
  gold22k: number;
  gold24k: number;
  silver: number;
  updatedAt: string;
};

/**
 * Reads the live rate through our own /api/gold-rates proxy — the upstream
 * feed sends no CORS headers, so the browser cannot call it directly.
 */
export async function getGoldRates(signal?: AbortSignal): Promise<GoldRates> {
  const res = await fetch("/api/gold-rates", signal ? { signal } : {});
  if (!res.ok) throw new Error(`gold rate request failed: ${res.status}`);
  return (await res.json()) as GoldRates;
}

const REFRESH_MS = 5 * 60 * 1000;

/** Shared by the header rate bar and the homepage hero so both show the same live number. */
export function useGoldRates() {
  const [rates, setRates] = useState<GoldRates | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = () => {
      getGoldRates(controller.signal)
        .then((data) => {
          if (!cancelled) {
            setRates(data);
            setFailed(false);
          }
        })
        .catch(() => {
          // A later refresh failing keeps showing the last good rate. Only flag
          // "failed" if we never had one, so callers don't loop on "loading" forever.
          if (!cancelled) setFailed(true);
        });
    };

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(id);
    };
  }, []);

  return { rates, failed };
}
