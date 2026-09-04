/**
 * GENERATED FROM THE APPROVED PUBLIC FRONTEND — do not edit by hand.
 * Source: frontend/src/data/*.ts  ·  regenerate with scripts/data/extract.mjs
 *
 * This is seed input only. Once `npm run seed` has run, Supabase is the
 * source of truth and nothing in the running API reads this file.
 */


export type ProductBadge = "New" | "Best Seller" | "Bridal Pick" | "Limited" | "Made to Order";

export type Product = {
  slug: string;
  name: string;
  description: string;
  purity: string;
  weight: string;
  designs: string;
  image: string;
  badge?: ProductBadge;
};

export type Collection = {
  /** URL path, e.g. "/gold-jewellery" */
  path: string;
  slug: string;
  name: string;
  eyebrow: string;
  heroTitle: string;
  heroLine: string;
  intro: string;
  banner: string;
  seoTitle: string;
  seoDescription: string;
  highlights: { label: string; value: string }[];
  craftNote: string;
  products: Product[];
};

const HALLMARK_22K = "22K · 916 BIS Hallmark";
const HALLMARK_18K = "18K · 750 BIS Hallmark";
const SILVER = "925 Sterling · Hallmarked";

export const collections: Collection[] = [
  {
    path: "/gold-jewellery",
    slug: "gold-jewellery",
    name: "Gold Jewellery",
    eyebrow: "22K & 18K",
    heroTitle: "Gold Jewellery",
    heroLine: "Weighed in front of you. Hallmarked before it leaves.",
    intro:
      "Every gram of gold that leaves our counter carries a BIS hallmark and a printed weight slip. Our karigars work in 22K for traditional pieces and 18K where a design needs the strength for stone setting — so the finish holds for a generation, not a season.",
    banner: "bridal",
    seoTitle: "22K & 18K Gold Jewellery in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "BIS hallmarked 22K and 18K gold jewellery — haaram, jhumkas, bangles and chains — hand-finished at Madhuri Jewellers, Vinayak Nagar X Road, Old Neredmet, Malkajgiri.",
    highlights: [
      { label: "Purity", value: "22K / 916 & 18K / 750" },
      { label: "Hallmark", value: "BIS with HUID on every piece" },
      { label: "Making charges", value: "Printed upfront, never hidden" },
    ],
    craftNote:
      "Traditional Hyderabadi goldsmithing — hand-drawn wire, hand-set kundan, and a final matte or mirror polish chosen piece by piece.",
    products: [
      {
        slug: "kasu-malai-long-haaram",
        name: "Kasu Malai Long Haaram",
        description:
          "Rows of Lakshmi coins strung on a hand-braided chain, weighted to sit flat through a full day of ceremony.",
        purity: HALLMARK_22K,
        weight: "48 – 86 g",
        designs: "22 designs in store",
        image: "temple",
        badge: "Best Seller",
      },
      {
        slug: "guttapusalu-necklace",
        name: "Guttapusalu Necklace",
        description:
          "Clustered pearl drops beneath a gold ruby-set frame — the piece Telugu brides ask for by name.",
        purity: HALLMARK_22K,
        weight: "62 – 110 g",
        designs: "14 designs in store",
        image: "bridal",
        badge: "Bridal Pick",
      },
      {
        slug: "hand-carved-mango-jhumka",
        name: "Hand-Carved Mango Jhumka",
        description:
          "Mango-motif dome jhumkas with a hollow-back build, so the weight stays kind to the earlobe.",
        purity: HALLMARK_22K,
        weight: "12 – 22 g",
        designs: "36 designs in store",
        image: "lightweight",
      },
      {
        slug: "broad-antique-kada-pair",
        name: "Broad Antique Kada Pair",
        description:
          "Wide screw-lock kadas in a matte antique finish, engraved along the rim and lined for comfort.",
        purity: HALLMARK_22K,
        weight: "38 – 70 g the pair",
        designs: "28 designs in store",
        image: "bangles",
      },
      {
        slug: "featherweight-daily-chain",
        name: "Featherweight Daily Chain",
        description:
          "A hollow-link 22K chain built for everyday wear — office, travel, and back again without a scratch.",
        purity: HALLMARK_22K,
        weight: "6 – 14 g",
        designs: "40+ designs in store",
        image: "lightweight",
        badge: "New",
      },
      {
        slug: "kundan-cocktail-ring",
        name: "Kundan Cocktail Ring",
        description:
          "Uncut kundan set into 18K for a stronger claw, finished with a beaded gold gallery underneath.",
        purity: HALLMARK_18K,
        weight: "5 – 11 g",
        designs: "19 designs in store",
        image: "antique",
      },
    ],
  },

  {
    path: "/silver-jewellery",
    slug: "silver-jewellery",
    name: "Silver Jewellery",
    eyebrow: "925 Sterling",
    heroTitle: "Silver Jewellery",
    heroLine: "Pooja silver, oxidised statement pieces, and gifts that last.",
    intro:
      "Our silver counter runs from pooja articles cast for daily use to oxidised tribal work and rhodium-finished sterling that will not tarnish in a Hyderabad monsoon. Everything is 925 and stamped.",
    banner: "antique",
    seoTitle: "925 Sterling Silver Jewellery & Pooja Silver | Madhuri Jewellers Secunderabad",
    seoDescription:
      "Oxidised silver jewellery, 925 sterling anklets, toe rings and pooja silver articles at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Purity", value: "925 sterling, stamped" },
      { label: "Finish", value: "Oxidised, rhodium or high polish" },
      { label: "Gifting", value: "Free presentation box" },
    ],
    craftNote:
      "Oxidised work is blackened by hand and then relieved with a brush, so the highlights follow the carving instead of sitting flat.",
    products: [
      {
        slug: "oxidised-tribal-choker",
        name: "Oxidised Tribal Choker",
        description:
          "A broad hand-carved collar with hanging ghungroo, weighted to hold its shape against the neck.",
        purity: SILVER,
        weight: "78 – 120 g",
        designs: "16 designs in store",
        image: "antique",
        badge: "Best Seller",
      },
      {
        slug: "sterling-payal-pair",
        name: "Sterling Payal Pair",
        description:
          "Classic anklets with a fine ghungroo edge and a double-hook clasp that survives real wear.",
        purity: SILVER,
        weight: "42 – 68 g the pair",
        designs: "24 designs in store",
        image: "bangles",
      },
      {
        slug: "lakshmi-pooja-set",
        name: "Lakshmi Pooja Set",
        description:
          "Kalash, deepam and plate finished together so the set reads as one piece on the mantap.",
        purity: SILVER,
        weight: "220 – 640 g",
        designs: "11 sets in store",
        image: "temple",
      },
      {
        slug: "silver-toe-ring-set",
        name: "Silver Toe Ring Set",
        description:
          "Adjustable metti in six traditional patterns, sized at the counter in minutes.",
        purity: SILVER,
        weight: "8 – 16 g",
        designs: "30+ designs in store",
        image: "lightweight",
      },
      {
        slug: "rhodium-tennis-bracelet",
        name: "Rhodium Tennis Bracelet",
        description:
          "Rhodium-plated sterling with a channel of white CZ — the everyday alternative to a diamond line.",
        purity: SILVER,
        weight: "14 – 22 g",
        designs: "9 designs in store",
        image: "bangles",
        badge: "New",
      },
      {
        slug: "baby-silver-kada-pair",
        name: "Baby Silver Kada Pair",
        description:
          "Smooth-edge kadas with a soft rattle inside, made without solder joints on the inner face.",
        purity: SILVER,
        weight: "18 – 30 g the pair",
        designs: "12 designs in store",
        image: "lightweight",
      },
    ],
  },

  {
    path: "/bridal-collection",
    slug: "bridal-collection",
    name: "Bridal Collection",
    eyebrow: "Wedding Sets",
    heroTitle: "Bridal Collection",
    heroLine: "One appointment. The whole trousseau, planned together.",
    intro:
      "Bridal buying is not six separate purchases. Book a private sitting and we lay the full set out at once — haaram, vaddanam, jhumkas, kadas, nethichutti and mattal — so proportions, finish and total weight are decided in one place, against your saree.",
    banner: "bridal",
    seoTitle: "Bridal Gold Jewellery Sets in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "Complete South Indian bridal jewellery sets — guttapusalu, vaddanam, nethichutti and kasu malai — with private appointments at Madhuri Jewellers, Malkajgiri.",
    highlights: [
      { label: "Appointment", value: "Private bridal room, by booking" },
      { label: "Lead time", value: "3 – 6 weeks for made-to-order" },
      { label: "Exchange", value: "Old gold accepted at fair assay" },
    ],
    craftNote:
      "Bridal sets are balanced as a group. We adjust link weight across the haaram and vaddanam so the whole ensemble sits evenly through a long muhurtham.",
    products: [
      {
        slug: "complete-bridal-set",
        name: "Complete Bridal Set",
        description:
          "Long haaram, short necklace, jhumkas, vaddanam and mattal, finished as one matched family.",
        purity: HALLMARK_22K,
        weight: "280 – 520 g",
        designs: "8 sets in store",
        image: "bridal",
        badge: "Bridal Pick",
      },
      {
        slug: "vaddanam-waist-belt",
        name: "Vaddanam Waist Belt",
        description:
          "Hinged gold panels with a concealed adjuster, so one belt fits through the whole wedding week.",
        purity: HALLMARK_22K,
        weight: "160 – 340 g",
        designs: "13 designs in store",
        image: "temple",
      },
      {
        slug: "nethichutti-maang-tikka",
        name: "Nethichutti Maang Tikka",
        description:
          "Centre-parting piece with a chain-and-hook fitting that will not pull at the hairline.",
        purity: HALLMARK_22K,
        weight: "14 – 28 g",
        designs: "17 designs in store",
        image: "antique",
      },
      {
        slug: "mattal-ear-chains",
        name: "Mattal Ear Chains",
        description:
          "Ear-to-hair chains that carry the jhumka weight upward — the reason brides can smile at hour six.",
        purity: HALLMARK_22K,
        weight: "10 – 20 g",
        designs: "15 designs in store",
        image: "lightweight",
      },
      {
        slug: "ruby-emerald-choker",
        name: "Ruby & Emerald Choker",
        description:
          "Closed-setting choker in Burmese-cut ruby and emerald, backed with hand-enamelled meenakari.",
        purity: HALLMARK_22K,
        weight: "88 – 150 g",
        designs: "10 designs in store",
        image: "bridal",
        badge: "Made to Order",
      },
      {
        slug: "bridal-bangle-stack",
        name: "Bridal Bangle Stack",
        description:
          "A graduated set of eight — two broad kadas, four carved, two plain — sized as a single stack.",
        purity: HALLMARK_22K,
        weight: "120 – 260 g",
        designs: "21 sets in store",
        image: "bangles",
      },
    ],
  },

  {
    path: "/temple-jewellery",
    slug: "temple-jewellery",
    name: "Temple Jewellery",
    eyebrow: "Nakshi Work",
    heroTitle: "Temple Jewellery",
    heroLine: "Lakshmi, peacock and mango — carved the way the sculptors did.",
    intro:
      "Temple jewellery began as adornment for deities and moved to dancers and brides. We keep to the old proportions: deep repoussé nakshi work, uncut ruby accents, and a matte gold that reads warm under lamp light rather than flashing under it.",
    banner: "temple",
    seoTitle: "Temple Jewellery & Nakshi Work | Madhuri Jewellers Secunderabad",
    seoDescription:
      "Handmade temple jewellery — Lakshmi kasu malai, nakshi haaram, peacock jhumkas and Bharatanatyam sets — at Madhuri Jewellers, Old Neredmet, Secunderabad.",
    highlights: [
      { label: "Technique", value: "Hand-repoussé nakshi" },
      { label: "Stones", value: "Uncut ruby & emerald accents" },
      { label: "Finish", value: "Warm matte, never machine-bright" },
    ],
    craftNote:
      "Each Lakshmi face is struck from a hand-cut die and then finished with a chasing tool, which is why no two coins in a kasu malai are identical.",
    products: [
      {
        slug: "lakshmi-nakshi-haaram",
        name: "Lakshmi Nakshi Haaram",
        description:
          "Full-length haaram with a seated Lakshmi pendant, ruby-eyed and framed in beaded gold.",
        purity: HALLMARK_22K,
        weight: "96 – 180 g",
        designs: "18 designs in store",
        image: "temple",
        badge: "Best Seller",
      },
      {
        slug: "peacock-jhumka",
        name: "Peacock Jhumka",
        description:
          "Twin peacocks over a fluted dome, with a pearl fringe that moves independently of the ear wire.",
        purity: HALLMARK_22K,
        weight: "16 – 30 g",
        designs: "25 designs in store",
        image: "antique",
      },
      {
        slug: "bharatanatyam-full-set",
        name: "Bharatanatyam Full Set",
        description:
          "Stage set with nethichutti, surya-chandra, jhumkas, oddiyanam and armlets — matched in tone.",
        purity: HALLMARK_22K,
        weight: "210 – 400 g",
        designs: "6 sets in store",
        image: "bridal",
        badge: "Made to Order",
      },
      {
        slug: "kasu-mala-coin-chain",
        name: "Kasu Mala Coin Chain",
        description:
          "A single strand of struck Lakshmi coins — the piece most often bought as a first temple purchase.",
        purity: HALLMARK_22K,
        weight: "34 – 62 g",
        designs: "20 designs in store",
        image: "temple",
      },
      {
        slug: "mango-motif-vanki",
        name: "Mango Motif Vanki",
        description:
          "V-shaped armlet with mango repoussé and a spring fitting that grips without pinching.",
        purity: HALLMARK_22K,
        weight: "26 – 48 g",
        designs: "12 designs in store",
        image: "antique",
      },
      {
        slug: "temple-motif-bangle-pair",
        name: "Temple Motif Bangle Pair",
        description:
          "Broad bangles carved with a gopuram border, given a deep matte to hold the shadow lines.",
        purity: HALLMARK_22K,
        weight: "58 – 96 g the pair",
        designs: "14 designs in store",
        image: "bangles",
      },
    ],
  },

  {
    path: "/antique-jewellery",
    slug: "antique-jewellery",
    name: "Antique Jewellery",
    eyebrow: "Victorian Finish",
    heroTitle: "Antique Jewellery",
    heroLine: "Matte gold, aged deliberately, polished only where light needs it.",
    intro:
      "Antique-finish jewellery is new gold treated to look lived-in. The surface is dulled, the recesses are darkened, and only the raised edges are brought back up — the effect Hyderabad's older workshops perfected and we still do by hand.",
    banner: "antique",
    seoTitle: "Antique & Victorian Finish Gold Jewellery | Madhuri Jewellers",
    seoDescription:
      "Antique finish gold jewellery with meenakari, kundan and victorian polish at Madhuri Jewellers, Vinayak Nagar X Road, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Finish", value: "Hand-aged matte with relief polish" },
      { label: "Detail", value: "Meenakari backs on most pieces" },
      { label: "Care", value: "Free re-polish for life" },
    ],
    craftNote:
      "The ageing is chemical, then mechanical. A wrong sequence turns the piece muddy, so a single karigar takes each item from dull to finished without handing it on.",
    products: [
      {
        slug: "victorian-layered-necklace",
        name: "Victorian Layered Necklace",
        description:
          "Three graduated strands with polki centres and a hand-painted meenakari reverse.",
        purity: HALLMARK_22K,
        weight: "84 – 148 g",
        designs: "15 designs in store",
        image: "antique",
        badge: "Best Seller",
      },
      {
        slug: "chandbali-earrings",
        name: "Chandbali Earrings",
        description:
          "Crescent chandbali with a pearl drop and a wire that tucks the weight behind the lobe.",
        purity: HALLMARK_22K,
        weight: "18 – 34 g",
        designs: "27 designs in store",
        image: "antique",
      },
      {
        slug: "meenakari-pendant-set",
        name: "Meenakari Pendant Set",
        description: "Enamelled peacock pendant with matching studs, fired in five colours.",
        purity: HALLMARK_22K,
        weight: "20 – 36 g",
        designs: "16 sets in store",
        image: "temple",
      },
      {
        slug: "polki-kundan-choker",
        name: "Polki Kundan Choker",
        description:
          "Uncut polki set in silver foil over gold, on an adjustable dori for a close fit.",
        purity: HALLMARK_22K,
        weight: "66 – 112 g",
        designs: "11 designs in store",
        image: "bridal",
      },
      {
        slug: "antique-broad-kada",
        name: "Antique Broad Kada",
        description:
          "Single statement kada with a hinged opening and a hidden safety catch inside the rim.",
        purity: HALLMARK_22K,
        weight: "44 – 78 g",
        designs: "13 designs in store",
        image: "bangles",
      },
      {
        slug: "nizami-jhumka",
        name: "Nizami Jhumka",
        description:
          "Deep dome jhumkas in the Hyderabadi Nizami line, edged with a fine gold rope twist.",
        purity: HALLMARK_22K,
        weight: "22 – 40 g",
        designs: "19 designs in store",
        image: "lightweight",
        badge: "New",
      },
    ],
  },

  {
    path: "/diamond-jewellery",
    slug: "diamond-jewellery",
    name: "Diamond Jewellery",
    eyebrow: "IGI Certified",
    heroTitle: "Diamond Jewellery",
    heroLine: "Every stone graded, plotted, and handed over with its certificate.",
    intro:
      "We stock VVS to SI clarity in E–H colour, set in 18K for claw strength. Solitaires above 0.30 carat arrive with an IGI or GIA certificate, and we will show you the plot under a loupe at the counter before you decide.",
    banner: "lightweight",
    seoTitle: "Certified Diamond Jewellery in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "IGI and GIA certified diamond rings, pendants, earrings and bracelets set in 18K gold at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Certification", value: "IGI / GIA above 0.30 ct" },
      { label: "Setting", value: "18K white, yellow or rose" },
      { label: "Buyback", value: "Written buyback on every solitaire" },
    ],
    craftNote:
      "Settings are cast in 18K and hand-tightened under magnification. A stone that moves under the tester goes back to the bench, not into the tray.",
    products: [
      {
        slug: "solitaire-engagement-ring",
        name: "Solitaire Engagement Ring",
        description:
          "Six-claw solitaire on a knife-edge band, sized while you wait and certified on collection.",
        purity: HALLMARK_18K,
        weight: "0.30 – 1.50 ct",
        designs: "24 designs in store",
        image: "lightweight",
        badge: "Best Seller",
      },
      {
        slug: "diamond-tennis-bracelet",
        name: "Diamond Tennis Bracelet",
        description:
          "A continuous line of matched rounds with a double-lock clasp and a safety figure-eight.",
        purity: HALLMARK_18K,
        weight: "1.80 – 4.20 ct",
        designs: "9 designs in store",
        image: "bangles",
      },
      {
        slug: "halo-diamond-pendant",
        name: "Halo Diamond Pendant",
        description:
          "Centre stone ringed by pavé, hung on an 18K cable chain that sits at the collarbone.",
        purity: HALLMARK_18K,
        weight: "0.25 – 0.90 ct",
        designs: "18 designs in store",
        image: "lightweight",
      },
      {
        slug: "diamond-stud-earrings",
        name: "Diamond Stud Earrings",
        description:
          "Matched pair sold with a screw-back fitting — the pair we recommend as a first diamond.",
        purity: HALLMARK_18K,
        weight: "0.20 – 1.00 ct pair",
        designs: "22 designs in store",
        image: "antique",
      },
      {
        slug: "eternity-band",
        name: "Eternity Band",
        description:
          "Full or half channel-set eternity, made to your finger size rather than resized after.",
        purity: HALLMARK_18K,
        weight: "0.50 – 2.00 ct",
        designs: "14 designs in store",
        image: "bangles",
        badge: "Made to Order",
      },
      {
        slug: "diamond-mangalsutra",
        name: "Diamond Mangalsutra",
        description:
          "Black bead chain with a pavé pendant in 18K — light enough to keep on through the day.",
        purity: HALLMARK_18K,
        weight: "0.15 – 0.60 ct",
        designs: "20 designs in store",
        image: "temple",
        badge: "New",
      },
    ],
  },

  {
    path: "/earrings",
    slug: "earrings",
    name: "Earrings Collection",
    eyebrow: "Jhumkas & Studs",
    heroTitle: "Earrings",
    heroLine: "From a six-gram stud to a full bridal jhumka.",
    intro:
      "The widest counter in the store. Hollow-back construction keeps our larger jhumkas wearable, and every drop earring is offered with an optional ear chain so the weight travels to the hairline instead of the lobe.",
    banner: "lightweight",
    seoTitle: "Gold Earrings, Jhumkas & Studs in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "Gold jhumkas, chandbali, studs and drops in 22K and 18K at Madhuri Jewellers, Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Range", value: "6 g studs to 40 g bridal jhumkas" },
      { label: "Comfort", value: "Hollow-back builds on heavy drops" },
      { label: "Fitting", value: "Screw, push or clip-on backs" },
    ],
    craftNote:
      "We test every drop earring on a weighted model before it goes into the tray — if it tilts forward, it goes back to be rebalanced.",
    products: [
      {
        slug: "classic-gold-studs",
        name: "Classic Gold Studs",
        description: "Everyday screw-back studs in six sizes, from a first piercing upward.",
        purity: HALLMARK_22K,
        weight: "2 – 6 g pair",
        designs: "40+ designs in store",
        image: "lightweight",
      },
      {
        slug: "bridal-jhumka-with-mattal",
        name: "Bridal Jhumka with Mattal",
        description: "Full-size jhumka supplied with detachable ear chains for the muhurtham.",
        purity: HALLMARK_22K,
        weight: "28 – 44 g pair",
        designs: "17 designs in store",
        image: "bridal",
        badge: "Bridal Pick",
      },
      {
        slug: "ruby-drop-chandbali",
        name: "Ruby Drop Chandbali",
        description: "Crescent frame with a single ruby drop and a pearl fringe along the arc.",
        purity: HALLMARK_22K,
        weight: "18 – 32 g pair",
        designs: "23 designs in store",
        image: "antique",
        badge: "Best Seller",
      },
      {
        slug: "hoop-bali-set",
        name: "Hoop Bali Set",
        description: "Textured 22K hoops in four diameters with a click-lock hinge.",
        purity: HALLMARK_22K,
        weight: "5 – 14 g pair",
        designs: "30 designs in store",
        image: "bangles",
      },
      {
        slug: "diamond-flower-tops",
        name: "Diamond Flower Tops",
        description: "Pavé floral tops in 18K, with an optional detachable pearl drop.",
        purity: HALLMARK_18K,
        weight: "0.30 – 0.80 ct pair",
        designs: "15 designs in store",
        image: "lightweight",
      },
      {
        slug: "temple-peacock-jhumka",
        name: "Temple Peacock Jhumka",
        description: "Antique-finish peacock jhumkas with uncut ruby eyes and a beaded rim.",
        purity: HALLMARK_22K,
        weight: "20 – 36 g pair",
        designs: "21 designs in store",
        image: "temple",
      },
    ],
  },

  {
    path: "/necklaces",
    slug: "necklaces",
    name: "Necklace Collection",
    eyebrow: "Haaram & Chokers",
    heroTitle: "Necklaces",
    heroLine: "Short, long, layered — sized to the neckline, not to a chart.",
    intro:
      "Chokers at 14 inches, princess at 18, and haaram running past 30 — we measure against the blouse you plan to wear it with. Adjustable extensions are fitted free on any piece bought here.",
    banner: "bridal",
    seoTitle: "Gold Necklaces & Haaram in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "Gold chokers, short necklaces, long haaram and guttapusalu in 22K at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Lengths", value: "14 in choker to 32 in haaram" },
      { label: "Adjuster", value: "Free extension chain fitted" },
      { label: "Clasps", value: "Screw, S-hook or box with safety" },
    ],
    craftNote:
      "Link weight is graded from the clasp toward the centre so a long haaram hangs straight instead of riding up at the back.",
    products: [
      {
        slug: "guttapusalu-haaram",
        name: "Guttapusalu Haaram",
        description: "Pearl-cluster drops under a ruby-set gold frame, the classic Telugu bridal.",
        purity: HALLMARK_22K,
        weight: "72 – 128 g",
        designs: "14 designs in store",
        image: "bridal",
        badge: "Bridal Pick",
      },
      {
        slug: "short-antique-necklace",
        name: "Short Antique Necklace",
        description: "Collar-length antique piece with meenakari reverse and an adjustable dori.",
        purity: HALLMARK_22K,
        weight: "42 – 78 g",
        designs: "22 designs in store",
        image: "antique",
      },
      {
        slug: "lakshmi-kasu-long-haaram",
        name: "Lakshmi Kasu Long Haaram",
        description: "Double row of struck Lakshmi coins with a temple-motif centre pendant.",
        purity: HALLMARK_22K,
        weight: "88 – 170 g",
        designs: "18 designs in store",
        image: "temple",
        badge: "Best Seller",
      },
      {
        slug: "lightweight-daily-necklace",
        name: "Lightweight Daily Necklace",
        description:
          "Hollow-build 22K necklace under 20 grams, made for wearing rather than storing.",
        purity: HALLMARK_22K,
        weight: "12 – 20 g",
        designs: "26 designs in store",
        image: "lightweight",
        badge: "New",
      },
      {
        slug: "polki-bridal-choker",
        name: "Polki Bridal Choker",
        description: "Uncut polki choker with emerald beads and hand-painted enamel behind.",
        purity: HALLMARK_22K,
        weight: "64 – 118 g",
        designs: "10 designs in store",
        image: "antique",
      },
      {
        slug: "diamond-collar-necklace",
        name: "Diamond Collar Necklace",
        description: "Pavé collar in 18K white gold with a tapered profile toward the clasp.",
        purity: HALLMARK_18K,
        weight: "2.40 – 6.00 ct",
        designs: "7 designs in store",
        image: "lightweight",
        badge: "Made to Order",
      },
    ],
  },

  {
    path: "/bangles",
    slug: "bangles",
    name: "Bangles Collection",
    eyebrow: "Kadas & Stacks",
    heroTitle: "Bangles",
    heroLine: "Sized 2.2 to 2.12, with a ring gauge on the counter.",
    intro:
      "Bangle sizing is where most jewellery goes wrong. We gauge both hands, account for the knuckle, and cut or extend in-house — so the pair you take home actually goes on.",
    banner: "bangles",
    seoTitle: "Gold Bangles, Kadas & Bracelets in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "22K gold bangles, broad kadas, screw bangles and bracelets in sizes 2.2 to 2.12 at Madhuri Jewellers, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Sizing", value: "2.2 to 2.12, gauged in store" },
      { label: "Alteration", value: "Cut or extend on the same visit" },
      { label: "Sets", value: "Pairs, fours and full stacks" },
    ],
    craftNote:
      "Screw-lock bangles get a double-thread so the joint does not loosen after a year of daily wear — a small detail that decides whether a bangle survives.",
    products: [
      {
        slug: "broad-carved-kada-pair",
        name: "Broad Carved Kada Pair",
        description: "Wide kadas with deep carving and a screw lock hidden inside the pattern.",
        purity: HALLMARK_22K,
        weight: "56 – 98 g pair",
        designs: "25 designs in store",
        image: "bangles",
        badge: "Best Seller",
      },
      {
        slug: "plain-gold-bangle-set",
        name: "Plain Gold Bangle Set",
        description:
          "Set of four smooth 22K bangles, the everyday stack most customers start with.",
        purity: HALLMARK_22K,
        weight: "34 – 62 g set",
        designs: "18 designs in store",
        image: "bangles",
      },
      {
        slug: "antique-lakshmi-kada",
        name: "Antique Lakshmi Kada",
        description: "Single broad kada with Lakshmi repoussé and a matte victorian finish.",
        purity: HALLMARK_22K,
        weight: "46 – 82 g",
        designs: "12 designs in store",
        image: "temple",
      },
      {
        slug: "diamond-bangle-pair",
        name: "Diamond Bangle Pair",
        description: "Pavé-set openable bangles in 18K with a hinge and a concealed catch.",
        purity: HALLMARK_18K,
        weight: "1.20 – 3.60 ct pair",
        designs: "8 designs in store",
        image: "lightweight",
      },
      {
        slug: "lightweight-daily-bangles",
        name: "Lightweight Daily Bangles",
        description: "Hollow-tube bangles under 10 grams each, comfortable under sleeves.",
        purity: HALLMARK_22K,
        weight: "16 – 28 g pair",
        designs: "31 designs in store",
        image: "lightweight",
        badge: "New",
      },
      {
        slug: "kids-gold-kada-pair",
        name: "Kids Gold Kada Pair",
        description: "Rounded-edge kadas with a soft clasp, made without inner solder seams.",
        purity: HALLMARK_22K,
        weight: "8 – 16 g pair",
        designs: "14 designs in store",
        image: "antique",
      },
    ],
  },

  {
    path: "/rings",
    slug: "rings",
    name: "Rings Collection",
    eyebrow: "Everyday to Engagement",
    heroTitle: "Rings",
    heroLine: "Sized on a mandrel, finished before you leave.",
    intro:
      "Indian sizes 6 through 26, adjusted at the bench while you have a coffee. Stone rings are set in 18K for claw strength; plain bands stay 22K for colour.",
    banner: "antique",
    seoTitle: "Gold & Diamond Rings in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "Engagement rings, cocktail rings, couple bands and daily-wear gold rings at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Sizes", value: "Indian 6 – 26" },
      { label: "Resizing", value: "Free for the first year" },
      { label: "Engraving", value: "Inside-band engraving in-store" },
    ],
    craftNote:
      "We resize from the shank, never through a stone setting, so the claws stay at their original tension.",
    products: [
      {
        slug: "solitaire-ring",
        name: "Solitaire Ring",
        description: "Certified centre stone on a tapered 18K band, engraved free on the inside.",
        purity: HALLMARK_18K,
        weight: "0.30 – 1.50 ct",
        designs: "24 designs in store",
        image: "lightweight",
        badge: "Best Seller",
      },
      {
        slug: "kundan-cocktail-ring-large",
        name: "Kundan Cocktail Ring",
        description: "Large uncut kundan with a beaded gold gallery and an open back for light.",
        purity: HALLMARK_18K,
        weight: "6 – 12 g",
        designs: "19 designs in store",
        image: "antique",
      },
      {
        slug: "couple-band-pair",
        name: "Couple Band Pair",
        description: "Matched 22K bands, one brushed and one polished, engraved to your dates.",
        purity: HALLMARK_22K,
        weight: "8 – 16 g pair",
        designs: "16 designs in store",
        image: "bangles",
      },
      {
        slug: "temple-motif-ring",
        name: "Temple Motif Ring",
        description: "Antique-finish ring with a Lakshmi face and a comfort-fit inner profile.",
        purity: HALLMARK_22K,
        weight: "4 – 9 g",
        designs: "13 designs in store",
        image: "temple",
      },
      {
        slug: "navaratna-ring",
        name: "Navaratna Ring",
        description: "Nine stones set in the prescribed order, with open backs for each gem.",
        purity: HALLMARK_22K,
        weight: "7 – 14 g",
        designs: "9 designs in store",
        image: "antique",
        badge: "Made to Order",
      },
      {
        slug: "daily-wear-band",
        name: "Daily Wear Band",
        description:
          "Plain or lightly textured 22K band under 5 grams — the workhorse of the tray.",
        purity: HALLMARK_22K,
        weight: "3 – 5 g",
        designs: "28 designs in store",
        image: "lightweight",
        badge: "New",
      },
    ],
  },

  {
    path: "/chains",
    slug: "chains",
    name: "Chains Collection",
    eyebrow: "Men & Women",
    heroTitle: "Chains",
    heroLine: "Sixteen inches to twenty-eight, hollow or solid, your call.",
    intro:
      "Hollow chains give you presence at a fraction of the weight; solid chains give you a piece that can be repaired forever. We will show you both in the same length so the difference is visible, not theoretical.",
    banner: "lightweight",
    seoTitle: "Gold Chains for Men & Women in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "22K gold chains — rope, box, curb, byzantine and hollow daily-wear designs — at Madhuri Jewellers, Vinayak Nagar X Road, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Lengths", value: "16 in to 28 in" },
      { label: "Build", value: "Hollow or solid, priced separately" },
      { label: "Repair", value: "Free clasp replacement for a year" },
    ],
    craftNote:
      "Clasps are the failure point on any chain. We fit an oversized spring ring or a box-with-safety on anything above 20 grams.",
    products: [
      {
        slug: "byzantine-link-chain",
        name: "Byzantine Link Chain",
        description:
          "Dense interlocked links with real depth — the heaviest look per gram we sell.",
        purity: HALLMARK_22K,
        weight: "22 – 48 g",
        designs: "12 designs in store",
        image: "bangles",
        badge: "Best Seller",
      },
      {
        slug: "hollow-rope-chain",
        name: "Hollow Rope Chain",
        description: "Classic rope twist in a hollow build, so a 24-inch stays under 12 grams.",
        purity: HALLMARK_22K,
        weight: "8 – 16 g",
        designs: "20 designs in store",
        image: "lightweight",
      },
      {
        slug: "solid-curb-chain",
        name: "Solid Curb Chain",
        description: "Flat-filed curb links in solid 22K, built to be handed down and repaired.",
        purity: HALLMARK_22K,
        weight: "28 – 62 g",
        designs: "15 designs in store",
        image: "bangles",
      },
      {
        slug: "black-bead-mangalsutra-chain",
        name: "Black Bead Mangalsutra Chain",
        description: "Two-strand nallapusalu chain with gold caps, sized for daily wear.",
        purity: HALLMARK_22K,
        weight: "10 – 22 g",
        designs: "24 designs in store",
        image: "temple",
      },
      {
        slug: "box-chain-fine",
        name: "Fine Box Chain",
        description: "A quiet box link for pendants, thin enough to disappear under a collar.",
        purity: HALLMARK_22K,
        weight: "4 – 9 g",
        designs: "18 designs in store",
        image: "lightweight",
        badge: "New",
      },
      {
        slug: "kids-gold-chain",
        name: "Kids Gold Chain",
        description: "Short 14-inch chain with a screw clasp that small hands cannot open.",
        purity: HALLMARK_22K,
        weight: "3 – 7 g",
        designs: "11 designs in store",
        image: "antique",
      },
    ],
  },

  {
    path: "/pendants",
    slug: "pendants",
    name: "Pendants Collection",
    eyebrow: "Lockets & Charms",
    heroTitle: "Pendants",
    heroLine: "Deity, initial, solitaire — with a bail that suits your chain.",
    intro:
      "A pendant is only as good as its bail. Ours are sized to the chain you already own — bring it in and we will fit it at the counter rather than guess.",
    banner: "temple",
    seoTitle: "Gold & Diamond Pendants in Secunderabad | Madhuri Jewellers",
    seoDescription:
      "Deity pendants, initial lockets, solitaire and antique pendants in 22K and 18K at Madhuri Jewellers, Old Neredmet, Malkajgiri, Secunderabad.",
    highlights: [
      { label: "Bails", value: "Fitted to your existing chain" },
      { label: "Options", value: "Deity, initial, solitaire, antique" },
      { label: "Gifting", value: "Presentation box included" },
    ],
    craftNote:
      "Deity pendants are cast from hand-carved masters rather than scanned files, which keeps the faces soft instead of sharp-edged.",
    products: [
      {
        slug: "lakshmi-deity-pendant",
        name: "Lakshmi Deity Pendant",
        description:
          "Seated Lakshmi in relief with a beaded frame and a wide, chain-friendly bail.",
        purity: HALLMARK_22K,
        weight: "6 – 14 g",
        designs: "17 designs in store",
        image: "temple",
        badge: "Best Seller",
      },
      {
        slug: "initial-letter-pendant",
        name: "Initial Letter Pendant",
        description: "Any letter, cut and finished in-store, with an optional pavé outline.",
        purity: HALLMARK_22K,
        weight: "2 – 6 g",
        designs: "26 letters available",
        image: "lightweight",
      },
      {
        slug: "solitaire-pendant",
        name: "Solitaire Pendant",
        description: "Single certified stone in a four-claw 18K mount on a fine box chain.",
        purity: HALLMARK_18K,
        weight: "0.25 – 1.00 ct",
        designs: "14 designs in store",
        image: "lightweight",
      },
      {
        slug: "antique-peacock-pendant",
        name: "Antique Peacock Pendant",
        description:
          "Meenakari peacock with a ruby drop, finished matte on the front, enamel behind.",
        purity: HALLMARK_22K,
        weight: "8 – 18 g",
        designs: "12 designs in store",
        image: "antique",
      },
      {
        slug: "om-pendant",
        name: "Om Pendant",
        description: "Clean 22K Om in three sizes, with a rounded reverse that sits flat on skin.",
        purity: HALLMARK_22K,
        weight: "3 – 8 g",
        designs: "9 designs in store",
        image: "temple",
      },
      {
        slug: "photo-locket",
        name: "Photo Locket",
        description: "Hinged locket with a sealed rim, sized for a passport photo insert.",
        purity: HALLMARK_22K,
        weight: "7 – 15 g",
        designs: "8 designs in store",
        image: "bangles",
        badge: "New",
      },
    ],
  },
];
