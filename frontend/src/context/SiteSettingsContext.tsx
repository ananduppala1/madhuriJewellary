import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as api from "@/api";
import type { BusinessHour, SiteSettings } from "@/types/api";

/**
 * Business details — phones, WhatsApp, address, hours, socials, rating — come
 * from the backend, and *only* from the backend.
 *
 * This provider used to seed itself with a hardcoded `SITE_FALLBACK` and keep
 * showing it when the request failed. That made a backend outage invisible and,
 * worse, made it look like the site was working while printing contact details
 * the shop may have changed months ago. A customer ringing a disconnected
 * number because the website was confidently wrong is a real cost.
 *
 * So `site` is now null until live settings arrive, and stays null if they
 * never do. Consumers render a skeleton of the same size while `loading`, and
 * simply omit the detail on `error` — the layout holds either way.
 */

export type SiteStatus = "loading" | "ready" | "error";

export type SiteContextValue = {
  /** Live settings, or null while loading and after a failure. Never a guess. */
  site: SiteSettings | null;
  status: SiteStatus;
  loading: boolean;
  error: string | null;
  reload: () => void;

  /* Derived values. Empty or null whenever the settings are not available. */
  phones: string[];
  primaryPhone: string | null;
  hours: BusinessHour[];
  addressLine: string | null;
  addressCity: string | null;
  fullAddress: string | null;
  mapsLink: string | null;
  mapsEmbed: string | null;
  telLink: (phone: string) => string;
  /** Null when the WhatsApp number is not known yet — callers hide the button. */
  whatsappLink: (message: string) => string | null;
};

const SiteContext = createContext<SiteContextValue | null>(null);

function derive(
  site: SiteSettings | null,
  status: SiteStatus,
  error: string | null,
  reload: () => void,
): SiteContextValue {
  const base = {
    site,
    status,
    loading: status === "loading",
    error,
    reload,
    telLink: (phone: string) => `tel:+91${phone}`,
  };

  if (!site) {
    return {
      ...base,
      phones: [],
      primaryPhone: null,
      hours: [],
      addressLine: null,
      addressCity: null,
      fullAddress: null,
      mapsLink: null,
      mapsEmbed: null,
      whatsappLink: () => null,
    };
  }

  const { street, locality, city, region, postalCode } = site.address;

  const addressLine = [street, locality].filter(Boolean).join(", ") || null;
  const addressCity =
    [[city, region].filter(Boolean).join(", "), postalCode].filter(Boolean).join(" ") || null;

  const query =
    site.mapsQuery ?? encodeURIComponent([addressLine, addressCity].filter(Boolean).join(", "));

  return {
    ...base,
    phones: site.phones,
    primaryPhone: site.phones[0] ?? null,
    hours: site.hours,
    addressLine,
    addressCity,
    fullAddress: [addressLine, addressCity].filter(Boolean).join(", ") || null,
    mapsLink: query ? `https://www.google.com/maps/search/?api=1&query=${query}` : null,
    mapsEmbed: query ? `https://www.google.com/maps?q=${query}&output=embed` : null,
    whatsappLink: (message: string) =>
      site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}` : null,
  };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<SiteStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    api
      .getSiteSettings({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setSettings(result);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        // No fallback. The detail is simply not shown until the API answers.
        setSettings(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "We could not reach the store's server just now.",
        );
        setStatus("error");
      });

    return () => controller.abort();
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const value = useMemo(
    () => derive(settings, status, error, reload),
    [settings, status, error, reload],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error("useSite must be used inside <SiteSettingsProvider>");
  }
  return context;
}
