import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react";
import {
  footerCollections,
  footerCompany,
  footerLegal,
  footerPieces,
  type NavLink,
} from "@/data/site";
import { BRAND_NAME } from "@/data/site";
import { useSite } from "@/context/SiteSettingsContext";
import { Wordmark } from "@/components/ui-kit/Logo";
import { TextSkeleton } from "@/components/ui-kit/AsyncStates";
import { Stars } from "@/components/ui-kit/primitives";

/**
 * Contact details here are backend-owned. Each block renders when its value
 * arrives, shows a placeholder of the same height while the request is in
 * flight, and is omitted entirely if the API cannot be reached — never filled
 * in from a hardcoded copy.
 */
export function Footer() {
  const { site, phones, hours, addressLine, addressCity, mapsLink, mapsEmbed, telLink, loading } =
    useSite();

  const socials = [
    { href: site?.instagram, label: "Instagram", Icon: Instagram },
    { href: site?.facebook, label: "Facebook", Icon: Facebook },
    { href: site?.youtube, label: "YouTube", Icon: Youtube },
  ].filter((item): item is { href: string; label: string; Icon: typeof Instagram } =>
    Boolean(item.href),
  );

  return (
    <footer className="on-dark relative border-t border-border bg-[#241d15] text-foreground">
      <div aria-hidden className="rule-gold" />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Wordmark />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A family jewellery house on Vinayak Nagar X Road — hand-finished 22K gold, printed
            making charges, and a BIS hallmark on every single piece since 2004.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Stars rating={5} />
            <span className="text-xs text-muted-foreground">
              {site?.rating != null && site.ratingCount != null ? (
                `${site.rating} from ${site.ratingCount} Google reviews`
              ) : loading ? (
                <TextSkeleton className="w-40" />
              ) : (
                "Google reviews"
              )}
            </span>
          </div>

          <ul className="mt-7 space-y-3.5 text-sm">
            {addressLine && mapsLink ? (
              <li>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 text-muted-foreground transition-colors hover:text-brand"
                >
                  <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    {addressLine}
                    <br />
                    {addressCity}
                  </span>
                </a>
              </li>
            ) : loading ? (
              <li className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand/40" />
                <span className="flex flex-col gap-1.5">
                  <TextSkeleton className="w-48" />
                  <TextSkeleton className="w-32" />
                </span>
              </li>
            ) : null}

            {phones.map((phone: string) => (
              <li key={phone}>
                <a
                  href={telLink(phone)}
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-brand"
                >
                  <Phone aria-hidden className="h-4 w-4 shrink-0 text-brand" /> +91 {phone}
                </a>
              </li>
            ))}
            {phones.length === 0 && loading ? (
              <li className="flex items-center gap-3">
                <Phone aria-hidden className="h-4 w-4 shrink-0 text-brand/40" />
                <TextSkeleton className="w-28" />
              </li>
            ) : null}

            {site?.email ? (
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-brand"
                >
                  <Mail aria-hidden className="h-4 w-4 shrink-0 text-brand" /> {site.email}
                </a>
              </li>
            ) : loading ? (
              <li className="flex items-center gap-3">
                <Mail aria-hidden className="h-4 w-4 shrink-0 text-brand/40" />
                <TextSkeleton className="w-44" />
              </li>
            ) : null}
          </ul>

          <ul className="mt-7 flex items-center gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${site?.name ?? BRAND_NAME} on ${label}`}
                  className="inline-flex h-10 w-10 items-center justify-center border border-brand/25 text-muted-foreground transition-all duration-300 hover:border-brand hover:text-brand"
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
          <FooterColumn title="Collections" links={footerCollections} />
          <FooterColumn title="By Piece" links={footerPieces} />
          <FooterColumn title="Visit" links={footerCompany} />
        </div>

        <div className="lg:col-span-3">
          <h3 className="eyebrow">Business Hours</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {hours.map((row) => (
              <li key={row.days} className="flex justify-between gap-4 text-muted-foreground">
                <span>{row.days}</span>
                <span className="text-foreground/85">{row.time}</span>
              </li>
            ))}
            {hours.length === 0 && loading
              ? Array.from({ length: 2 }, (_, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <TextSkeleton className="w-28" />
                    <TextSkeleton className="w-24" />
                  </li>
                ))
              : null}
          </ul>

          {/* The map is built from the address, so it waits for it too. */}
          {mapsEmbed ? (
            <div className="mt-7 border border-border">
              <iframe
                title={`Map to ${site?.name ?? BRAND_NAME}`}
                src={mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-44 w-full grayscale-[0.4] contrast-[1.1]"
              />
            </div>
          ) : (
            <div aria-hidden className="mt-7 h-44 border border-border bg-border/30" />
          )}

          {mapsLink ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-[0.64rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground"
            >
              Get directions →
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-[0.64rem] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site?.name ?? BRAND_NAME}. All rights reserved.
          </p>
          <ul className="flex items-center gap-5">
            {footerLegal.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="transition-colors hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="eyebrow">{title}</h3>
      <ul className="mt-5 space-y-2.5">
        {links.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
