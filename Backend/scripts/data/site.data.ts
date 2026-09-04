/**
 * GENERATED FROM THE APPROVED PUBLIC FRONTEND — do not edit by hand.
 * Source: frontend/src/data/*.ts  ·  regenerate with scripts/data/extract.mjs
 *
 * This is seed input only. Once `npm run seed` has run, Supabase is the
 * source of truth and nothing in the running API reads this file.
 */

export const site = {
  name: "Madhuri Jewellers",
  legalName: "Madhuri Jewellers",
  tagline: "Hyderabad's family jeweller since 2004",
  shortDescription:
    "BIS hallmarked 22K gold, bridal, temple and antique jewellery, hand-finished in Secunderabad.",
  url: "https://www.madhurijewellers.in",
  founded: "2004",

  phones: ["9440964379", "8977181158"],
  whatsapp: "919440964379",
  email: "care@madhurijewellers.in",

  instagram: "https://www.instagram.com/madhuri_jewellers2024/",
  facebook: "https://www.facebook.com/madhurijewellers",
  youtube: "https://www.youtube.com/@madhurijewellers",

  address: {
    street: "Vinayak Nagar X Road, Old Neredmet",
    locality: "Malkajgiri",
    city: "Secunderabad",
    region: "Telangana",
    postalCode: "500056",
    country: "IN",
  },

  geo: { lat: 17.4735, lng: 78.5416 },

  mapsQuery: "Madhuri+Jewellers+Vinayak+Nagar+Old+Neredmet+Malkajgiri+Secunderabad",

  hours: [
    { days: "Monday – Saturday", time: "10:30 am – 9:00 pm" },
    { days: "Sunday", time: "11:00 am – 8:30 pm" },
  ],
  hoursShort: "Open all week · 10:30 am – 9:00 pm",

  rating: 4.9,
  ratingCount: 486,
} as const;
