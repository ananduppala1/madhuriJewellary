/* ── Trust strip / stats ───────────────────────────────────── */

export const stats = [
  { value: "20+", label: "Years on Vinayak Nagar X Road" },
  { value: "12,000+", label: "Families served since 2004" },
  { value: "100%", label: "BIS hallmarked with HUID" },
  { value: "4.9★", label: "Average Google rating" },
] as const;

/* ── Why choose us ─────────────────────────────────────────── */

export type ValueProp = { icon: string; title: string; body: string };

export const whyChooseUs: ValueProp[] = [
  {
    icon: "ShieldCheck",
    title: "Hallmarked, every gram",
    body: "Each piece carries a BIS hallmark with a six-digit HUID. We hand you the weight slip and the purity certificate together, before payment.",
  },
  {
    icon: "Scale",
    title: "Transparent making charges",
    body: "Making charges are printed on the estimate, not negotiated after you have fallen for the piece. What you are quoted is what you pay.",
  },
  {
    icon: "Hammer",
    title: "Our own karigars",
    body: "Repoussé, kundan setting and finishing happen at our own bench. That is why we can alter a design instead of only reordering it.",
  },
  {
    icon: "RefreshCw",
    title: "Fair exchange & buyback",
    body: "Old gold is assayed openly on a karat meter you can watch. The rate on the board is the rate you get.",
  },
  {
    icon: "Sparkles",
    title: "Lifetime polish & service",
    body: "Bring anything bought here back for cleaning, re-polish, clasp repair or resizing. No appointment, no charge.",
  },
  {
    icon: "HeartHandshake",
    title: "Family jewellers, not a chain",
    body: "The same family has stood behind this counter since 2004. You will speak to the person accountable for the piece.",
  },
];

/* ── Craftsmanship steps ───────────────────────────────────── */

export const craftSteps = [
  {
    step: "Alloying",
    body: "24K bullion is alloyed to 916 in small batches so the colour stays consistent across a matched bridal set.",
  },
  {
    step: "Forming",
    body: "Sheet is raised and repoussé work is punched from the reverse — the technique that gives temple pieces their depth.",
  },
  {
    step: "Setting",
    body: "Kundan is pressed in with 24K foil by hand. Claw settings for diamonds are tightened under a loupe.",
  },
  {
    step: "Finishing",
    body: "Antique pieces are aged and then relieved; bright pieces are polished through six grades to a mirror.",
  },
  {
    step: "Assay",
    body: "Every finished item goes to a BIS assay centre and returns stamped with purity, mark and HUID.",
  },
] as const;

/* ── Testimonials ──────────────────────────────────────────── */

export type Testimonial = {
  name: string;
  location: string;
  rating: 5 | 4;
  date: string;
  body: string;
  occasion: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Sravanthi Reddy",
    location: "Malkajgiri",
    rating: 5,
    date: "March 2026",
    occasion: "Bridal purchase",
    body: "We bought my sister's entire bridal set here. They laid out the haaram, vaddanam and jhumkas together and adjusted the weights until it sat properly with her saree. No pressure, no rushing us on a Sunday evening.",
  },
  {
    name: "Kiran Kumar",
    location: "Old Neredmet",
    rating: 5,
    date: "February 2026",
    occasion: "Gold exchange",
    body: "Exchanged my mother's old chains. They tested everything on the karat meter in front of me and the rate matched the board exactly. That kind of straightforwardness is why the family keeps going back.",
  },
  {
    name: "Anjali Prasad",
    location: "Safilguda",
    rating: 5,
    date: "January 2026",
    occasion: "Temple jewellery",
    body: "The nakshi work on their Lakshmi haaram is genuinely hand done — you can see the tool marks. I compared it against three showrooms in Secunderabad before deciding.",
  },
  {
    name: "Venkatesh Rao",
    location: "AS Rao Nagar",
    rating: 5,
    date: "December 2025",
    occasion: "Diamond ring",
    body: "Bought an engagement ring. They showed me the IGI plot under a loupe and explained what I was actually paying for. First jeweller who did not talk down to me about clarity grades.",
  },
  {
    name: "Lakshmi Devi",
    location: "Moula Ali",
    rating: 5,
    date: "December 2025",
    occasion: "Repair & polish",
    body: "Took in a forty-year-old bangle with a broken screw. They repaired and polished it and refused to charge me because I had bought other things there years ago.",
  },
  {
    name: "Harika Nallamothu",
    location: "Sainikpuri",
    rating: 5,
    date: "November 2025",
    occasion: "Daily wear",
    body: "Their lightweight range is the real find. Under fifteen grams and still looks substantial. I wear the same necklace to office every day.",
  },
  {
    name: "Rajesh Gupta",
    location: "ECIL",
    rating: 5,
    date: "October 2025",
    occasion: "Festival buying",
    body: "Went for Dhanteras expecting a crowd and a hard sell. Got neither. Making charges were on the estimate before I asked, which almost never happens.",
  },
  {
    name: "Padmaja Sharma",
    location: "Vinayak Nagar",
    rating: 5,
    date: "September 2025",
    occasion: "Custom order",
    body: "They recreated my grandmother's chandbali from a photograph. Took five weeks and it came out closer than I expected. The karigar came out to explain what he had changed and why.",
  },
];

/* ── FAQs ──────────────────────────────────────────────────── */

export type FaqGroup = { group: string; items: { q: string; a: string }[] };

export const faqGroups: FaqGroup[] = [
  {
    group: "Purity & hallmarking",
    items: [
      {
        q: "Is every piece BIS hallmarked?",
        a: "Yes. Every gold item we sell carries the BIS mark, the purity grade (916 for 22K, 750 for 18K) and a six-digit HUID that you can verify yourself in the BIS Care app before you leave the counter.",
      },
      {
        q: "What is the difference between 22K and 18K here?",
        a: "22K is 91.6% gold — richer colour, softer metal, and what we use for traditional and bridal work. 18K is 75% gold and harder, so it holds diamond and stone settings better. We tell you which one a design needs rather than defaulting to one.",
      },
      {
        q: "Can I check the weight myself?",
        a: "Please do. Weighing happens on a calibrated scale on the counter, and the gross weight, net weight and stone weight are all printed separately on your estimate.",
      },
    ],
  },
  {
    group: "Pricing & making charges",
    items: [
      {
        q: "How are making charges calculated?",
        a: "As a percentage of the gold value, varying by how much handwork the piece needs — plain chains are lowest, hand-repoussé temple work is highest. The percentage is written on the estimate before you commit.",
      },
      {
        q: "Do you show today's gold rate?",
        a: "The 22K and 18K rates are on the board at the entrance and updated every morning. The rate on the board at the time of billing is the rate applied.",
      },
      {
        q: "Is GST included in the quoted price?",
        a: "GST at 3% is applied on the total of gold value plus making charges and is shown as a separate line on the invoice.",
      },
    ],
  },
  {
    group: "Exchange, buyback & repair",
    items: [
      {
        q: "Do you accept old gold in exchange?",
        a: "Yes. We test purity on a karat meter while you watch, deduct for stones and solder, and apply the assessed value against your new purchase. Nothing is taken to a back room.",
      },
      {
        q: "What is your buyback policy?",
        a: "Gold bought from us is bought back at the prevailing rate for its assessed purity, less standard deductions. Certified solitaires carry a written buyback commitment on the invoice.",
      },
      {
        q: "Do you repair jewellery bought elsewhere?",
        a: "We do, for a charge. Cleaning, polishing, clasp replacement and resizing on pieces bought from us are free for life.",
      },
    ],
  },
  {
    group: "Visiting the store",
    items: [
      {
        q: "Do I need an appointment?",
        a: "Not for browsing. For bridal buying we recommend booking, so the private room and a senior karigar are free when you arrive. Call or WhatsApp us a day ahead.",
      },
      {
        q: "How long does a custom order take?",
        a: "Three to six weeks depending on the handwork. Bridal sets ordered less than a month before a wedding date are usually possible but should be discussed first.",
      },
      {
        q: "Where exactly are you located?",
        a: "Vinayak Nagar X Road, Old Neredmet, Malkajgiri, Secunderabad. We are on the main road with parking directly outside, five minutes from Safilguda station.",
      },
    ],
  },
];

/* ── Offers ────────────────────────────────────────────────── */

export type Offer = {
  title: string;
  hook: string;
  body: string;
  terms: string;
  tag: string;
};

export const offers: Offer[] = [
  {
    tag: "Bridal",
    title: "Making charges waived up to 20%",
    hook: "On complete bridal sets above 150 grams",
    body: "Book a bridal appointment and take the full set — haaram, vaddanam, jhumkas, kadas and mattal — with making charges reduced by up to twenty percent depending on total weight.",
    terms:
      "Applies to sets purchased in a single invoice. Cannot be combined with the gold savings plan.",
  },
  {
    tag: "Savings Plan",
    title: "Eleven months, twelfth on us",
    hook: "The Madhuri gold savings scheme",
    body: "Pay a fixed amount for eleven months and we add the twelfth instalment. At maturity, redeem the full value against any jewellery in the store at that day's rate.",
    terms: "Minimum ₹2,000 per month. Redeemable against jewellery only, not bullion or coins.",
  },
  {
    tag: "Exchange",
    title: "Zero deduction on your first 10 grams",
    hook: "Old gold exchange, this season",
    body: "Bring in old gold and we waive the standard refining deduction on the first ten grams assessed — the difference goes straight into your new piece.",
    terms: "Purity assessed on our karat meter. Stones and solder weight excluded.",
  },
  {
    tag: "Silver",
    title: "Flat making charges on pooja silver",
    hook: "Festival silver, priced simply",
    body: "All 925 pooja articles carry a flat per-gram making charge through the festival season, whatever the design complexity.",
    terms: "Applies to pooja articles only, not to silver jewellery.",
  },
  {
    tag: "Diamond",
    title: "Free lifetime maintenance",
    hook: "On every certified solitaire",
    body: "Certified solitaires include lifetime cleaning, rhodium re-plating and claw tightening — the servicing that actually keeps a stone secure.",
    terms: "Applies to solitaires above 0.30 ct purchased with certificate.",
  },
  {
    tag: "First Visit",
    title: "A silver coin on your first purchase",
    hook: "Welcome to the counter",
    body: "First-time customers spending above ₹25,000 receive a 5-gram 999 silver Lakshmi coin, boxed.",
    terms: "One per household. While stocks last.",
  },
];

/* ── Gallery ───────────────────────────────────────────────── */
/*
 * Gallery items used to live here. They are now admin-managed and served from
 * `/api/v1/public/gallery`; see `useGallery()`. The category tabs that used to
 * be `galleryFilters` are declared in the gallery route, next to the UI that
 * renders them.
 */

/* ── About page ────────────────────────────────────────────── */

export const storyParagraphs = [
  "Madhuri Jewellers opened on Vinayak Nagar X Road in 2004 with one glass case, two karigars and a rule that has not changed since: the customer sees the scale, the assay and the estimate before the piece is wrapped.",
  "Old Neredmet was a quieter place then. Families came for a first chain at a naming ceremony and returned twenty years later for a bridal set for the same child. That arc — not a season's sales figure — is how we measure whether we are doing this properly.",
  "Today the store runs a full bench: repoussé, kundan setting, enamelling and finishing all happen here rather than being ordered in from a wholesaler. It is slower and it costs more. It is also the only way we can alter a design to suit a face, a neckline or a budget instead of telling you what is available.",
];

export const missionVision = [
  {
    title: "Our Mission",
    body: "To make buying gold in Secunderabad an honest, unhurried transaction — hallmarked purity, printed making charges, and a karigar you can actually speak to.",
  },
  {
    title: "Our Vision",
    body: "To keep hand-worked Hyderabadi goldsmithing alive at a price a working family can plan for, and to pass the bench on to karigars we have trained ourselves.",
  },
];

export const trustPoints = [
  "Purity slip and HUID handed over with every piece, before payment",
  "Making charges printed on the estimate, never adjusted afterward",
  "Old gold assayed on a karat meter you watch, at the board rate",
  "Lifetime cleaning, polishing and clasp repair on anything bought here",
  "Bridal appointments in a private room with a senior karigar present",
  "The same family behind the counter since 2004",
];
