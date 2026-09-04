/**
 * NAVIGATION AND BUILD CONSTANTS
 * ------------------------------
 * Route *structure*, not content. These arrays describe how the site is laid
 * out and change only when a developer adds a page, so they belong in the
 * bundle.
 *
 * What used to live here — `SITE_FALLBACK`, a hardcoded copy of the shop's
 * phone numbers, address, hours and rating — is gone. Business details are
 * owned by the backend, and rendering a stale copy of them when the API is
 * unreachable is worse than rendering nothing: a customer would ring a number
 * the shop had already changed. Components now read `useSite()`, which is null
 * until the live settings arrive and stays null if they never do.
 *
 * The two constants below are not business data. They are deployment facts
 * baked in at build time: the brand name used in document titles and
 * schema.org markup, and the canonical origin used to build absolute URLs.
 * Neither is editable in the dashboard, and neither changes what a visitor is
 * told about how to contact the shop.
 */

export const BRAND_NAME = "Madhuri Jewellers";

/** Canonical origin used to build absolute URLs for SEO tags and schema.org. */
export const SITE_URL = "https://www.madhurijewellers.in";

/* ── Navigation ──────────────────────────────────────── */

export type NavLink = { to: string; label: string; note?: string };

export type MegaColumn = { title: string; links: NavLink[] };

export const megaMenu: MegaColumn[] = [
  {
    title: "By Metal",
    links: [
      { to: "/gold-jewellery", label: "Gold Jewellery", note: "22K & 18K BIS hallmarked" },
      { to: "/silver-jewellery", label: "Silver Jewellery", note: "925 sterling & pooja silver" },
      { to: "/diamond-jewellery", label: "Diamond Jewellery", note: "IGI certified solitaires" },
    ],
  },
  {
    title: "By Occasion",
    links: [
      { to: "/bridal-collection", label: "Bridal Collection", note: "Full wedding sets" },
      { to: "/temple-jewellery", label: "Temple Jewellery", note: "Nakshi & Lakshmi motifs" },
      { to: "/antique-jewellery", label: "Antique Jewellery", note: "Matte & victorian finish" },
    ],
  },
  {
    title: "By Piece",
    links: [
      { to: "/necklaces", label: "Necklaces & Haaram" },
      { to: "/earrings", label: "Earrings & Jhumkas" },
      { to: "/bangles", label: "Bangles & Kadas" },
      { to: "/rings", label: "Rings" },
      { to: "/chains", label: "Chains" },
      { to: "/pendants", label: "Pendants" },
    ],
  },
  {
    title: "What's New",
    links: [
      { to: "/new-arrivals", label: "New Arrivals", note: "Added this month" },
      { to: "/latest-collections", label: "Latest Collections", note: "Seasonal edits" },
      { to: "/offers", label: "Offers & Schemes", note: "Making charge waivers" },
    ],
  },
];

export const primaryNav: NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/gallery", label: "Gallery" },
  { to: "/offers", label: "Offers" },
  { to: "/contact", label: "Contact" },
];

export const footerCollections: NavLink[] = [
  { to: "/gold-jewellery", label: "Gold Jewellery" },
  { to: "/silver-jewellery", label: "Silver Jewellery" },
  { to: "/diamond-jewellery", label: "Diamond Jewellery" },
  { to: "/bridal-collection", label: "Bridal Collection" },
  { to: "/temple-jewellery", label: "Temple Jewellery" },
  { to: "/antique-jewellery", label: "Antique Jewellery" },
];

export const footerPieces: NavLink[] = [
  { to: "/necklaces", label: "Necklaces" },
  { to: "/earrings", label: "Earrings" },
  { to: "/bangles", label: "Bangles" },
  { to: "/rings", label: "Rings" },
  { to: "/chains", label: "Chains" },
  { to: "/pendants", label: "Pendants" },
];

export const footerCompany: NavLink[] = [
  { to: "/about", label: "About Us" },
  { to: "/latest-collections", label: "Latest Collections" },
  { to: "/gallery", label: "Gallery" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contact", label: "Contact" },
];

export const footerLegal: NavLink[] = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Use" },
];
