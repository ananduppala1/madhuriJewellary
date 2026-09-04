/**
 * GENERATED FROM THE APPROVED PUBLIC FRONTEND — do not edit by hand.
 * Source: frontend/src/data/*.ts  ·  regenerate with scripts/data/extract.mjs
 *
 * This is seed input only. Once `npm run seed` has run, Supabase is the
 * source of truth and nothing in the running API reads this file.
 */

export type GalleryItem = {
  id: string;
  caption: string;
  category: "Store" | "Jewellery" | "Craft" | "Moments";
  image: string;
  /** Masonry span — "tall" items take two rows on desktop. */
  span: "tall" | "wide" | "normal";
};

export const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    caption: "The main hall on Vinayak Nagar X Road",
    category: "Store",
    image: "store",
    span: "wide",
  },
  {
    id: "g2",
    caption: "Guttapusalu haaram, ruby set",
    category: "Jewellery",
    image: "bridal",
    span: "tall",
  },
  {
    id: "g3",
    caption: "Nakshi Lakshmi coins before stringing",
    category: "Craft",
    image: "temple",
    span: "normal",
  },
  {
    id: "g4",
    caption: "Broad carved kadas, matte finish",
    category: "Jewellery",
    image: "bangles",
    span: "normal",
  },
  {
    id: "g5",
    caption: "Antique chandbali with pearl fringe",
    category: "Jewellery",
    image: "antique",
    span: "tall",
  },
  {
    id: "g6",
    caption: "Lightweight daily range",
    category: "Jewellery",
    image: "lightweight",
    span: "normal",
  },
  {
    id: "g7",
    caption: "The bridal room, set for an appointment",
    category: "Store",
    image: "store",
    span: "normal",
  },
  {
    id: "g8",
    caption: "Repoussé punching at the bench",
    category: "Craft",
    image: "temple",
    span: "normal",
  },
  {
    id: "g9",
    caption: "A Sankranti morning at the counter",
    category: "Moments",
    image: "bridal",
    span: "wide",
  },
  {
    id: "g10",
    caption: "Bangle sizing on the mandrel",
    category: "Craft",
    image: "bangles",
    span: "normal",
  },
  {
    id: "g11",
    caption: "Meenakari enamel, five colours fired",
    category: "Craft",
    image: "antique",
    span: "tall",
  },
  {
    id: "g12",
    caption: "Evening light through the front window",
    category: "Store",
    image: "store",
    span: "normal",
  },
];

export const galleryFilters = ["All", "Store", "Jewellery", "Craft", "Moments"] as const;
