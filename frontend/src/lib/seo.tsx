import { useEffect } from "react";
import { BRAND_NAME, SITE_URL } from "@/data/site";
import type { Product, SiteSettings } from "@/types/api";
import { JsonLd } from "@/components/ui-kit/primitives";

/**
 * Canonical URLs and the brand name are deployment constants — they are fixed
 * at build time and are not editable in the dashboard.
 *
 * Every *business* fact — phone, address, hours, rating, socials — is
 * admin-managed, so the builders that need them take the live settings as an
 * argument and are only rendered once those settings have actually arrived.
 * Nothing here invents a contact detail.
 */
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

type SeoInput = {
  title: string;
  description: string;
  /** Path with leading slash, e.g. "/about". */
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";

/** Create-or-update, so we never append a second copy of a tag index.html already ships. */
function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-page document head: title, description, canonical, Open Graph and
 * Twitter cards.
 *
 * Tags are written imperatively rather than rendered. React 19 *appends*
 * hoisted <title>/<meta>, which would leave two of each alongside the static
 * fallbacks in index.html — and search engines would read the generic one.
 */
export function Seo({ title, description, path, image, type = "website", noIndex }: SeoInput) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const ogImage = image ?? DEFAULT_OG;

  useEffect(() => {
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : DEFAULT_ROBOTS);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:image:alt", `${BRAND_NAME} — ${title}`);
    upsertMeta("property", "og:locale", "en_IN");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    upsertCanonical(url);
  }, [title, description, url, ogImage, type, noIndex]);

  return null;
}

/* ── schema.org builders ───────────────────────────────────── */

export function localBusinessSchema(site: SiteSettings) {
  const phoneList = site.phones.map((p) => `+91-${p}`);

  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${SITE_URL}/#store`,
    name: site.name,
    description: site.shortDescription,
    url: SITE_URL,
    telephone: phoneList[0],
    email: site.email,
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Bank Transfer",
    foundingDate: site.founded,
    image: DEFAULT_OG,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: `${site.address.locality}, ${site.address.city}`,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${site.mapsQuery}`,
    /**
     * Hours are published as the shop's own free-text strings rather than the
     * structured open/close pairs this used to hardcode. The old version said
     * 10:30–21:00 no matter what the dashboard held, which would have kept
     * telling Google the old hours after the shop changed them.
     */
    ...(site.hours.length > 0
      ? { openingHours: site.hours.map((row) => `${row.days} ${row.time}`) }
      : {}),
    ...(site.rating !== null && site.ratingCount !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: site.rating,
            reviewCount: site.ratingCount,
            bestRating: 5,
          },
        }
      : {}),
    sameAs: [site.instagram, site.facebook, site.youtube].filter(Boolean),
    areaServed: ["Secunderabad", "Malkajgiri", "Old Neredmet", "Safilguda", "Hyderabad"],
  };
}

export function organizationSchema(site: SiteSettings) {
  const phoneList = site.phones.map((p) => `+91-${p}`);
  const fullAddress = [
    site.address.street,
    site.address.locality,
    site.address.city,
    site.address.region,
    site.address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: site.legalName ?? site.name,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: site.shortDescription,
    address: fullAddress,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: phoneList[0],
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Telugu", "Hindi", "Urdu"],
    },
    sameAs: [site.instagram, site.facebook, site.youtube].filter(Boolean),
  };
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: BRAND_NAME,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
};

export function breadcrumbSchema(trail: { label: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}

export function collectionSchema(input: {
  name: string;
  description: string;
  path: string;
  items: { name: string; description: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: `${SITE_URL}${input.path}`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#store` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.name,
          description: item.description,
          brand: { "@type": "Brand", name: BRAND_NAME },
        },
      })),
    },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function reviewSchema(
  reviews: { name: string; body: string; rating: number; date: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    "@id": `${SITE_URL}/#store`,
    name: BRAND_NAME,
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
      datePublished: r.date,
    })),
  };
}

/**
 * Product structured data for the detail pages. No price is published on this
 * website — the piece is quoted at the counter from the day's metal rate — so
 * `offers` deliberately advertises availability and contact only.
 */
export const productSchema = {
  Tag({ product, url }: { product: Product; url: string }) {
    const image = product.images.find((item) => item.isPrimary) ?? product.images[0];

    return (
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          url,
          ...(image ? { image: image.url } : {}),
          brand: { "@type": "Brand", name: BRAND_NAME },
          ...(product.purity ? { material: product.purity } : {}),
          ...(product.weight ? { weight: product.weight } : {}),
          ...(product.collection ? { category: product.collection.name } : {}),
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStoreOnly",
            priceCurrency: "INR",
            url,
            seller: { "@id": `${SITE_URL}/#store` },
          },
        }}
      />
    );
  },
};
