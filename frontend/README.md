# Public website

The customer-facing site for Madhuri Jewellers. React 19, TypeScript, Vite,
React Router, Tailwind CSS, Framer Motion.

The visual design is unchanged from the approved build. What changed is where
the data comes from: collections, products, gallery and contact details are now
fetched from the Backend API instead of being compiled into the bundle.

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

The Backend must be running and seeded first — see `../Backend/README.md`.

## Configuration

One variable, and it is public by design:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Every `VITE_*` value is compiled into the JavaScript bundle and readable by
anyone with DevTools open. There is no Supabase key, Cloudinary key or token
here, and there must never be one — the site only ever talks to the Backend.

## How data reaches the page

```
component  →  hook (src/hooks)  →  endpoint (src/api)  →  client (src/lib/api-client.ts)
```

Components never call `fetch` directly. The client owns the base URL, the
response envelope and error translation; `useAsync` owns loading, error and
cancellation. A fast click through the mega menu aborts the previous request
rather than letting stale data land on the new page.

| Concern                        | Where                                    |
| ------------------------------ | ---------------------------------------- |
| HTTP and error shaping         | `src/lib/api-client.ts`                  |
| Typed endpoints                | `src/api/index.ts`                       |
| React data hooks               | `src/hooks/useCatalogue.ts`              |
| Business details (live)        | `src/context/SiteSettingsContext.tsx`    |
| Response types                 | `src/types/api.ts`                       |
| Local vs Cloudinary images     | `src/lib/media.ts`                       |
| Loading / error / empty states | `src/components/ui-kit/AsyncStates.tsx`  |
| Paged grids and "Load more"    | `usePagedProducts`, `src/components/ui-kit/LoadMore.tsx` |

## Paging

The collection and new-arrivals pages used to request the whole catalogue in one
call. They now load 24 at a time and append:

- `/collections/:slug` returns its first page of products with the hero, so
  opening a collection is still **one** request.
- "Load more" appends the next page. Cards already on screen are never
  re-rendered, so the visitor's scroll position does not move — and while a page
  is in flight the button is replaced by card skeletons of the same size, so the
  page grows by a predictable amount instead of jumping under a thumb.
- The card, the grid and the spacing are unchanged.

## Prefetching

Hovering or focusing a product card sends the request its detail page will make.
Nothing is stored client-side — the point is to have the backend answer from
Redis before the click rather than after it. It fires once per piece per session.

This is deliberately *not* a second cache. A client-side copy of the catalogue
is exactly how a site ends up showing something the shop has already changed,
which is why there is no `localStorage` or `sessionStorage` catalogue anywhere
in this bundle.

## Product pages

Product cards now lead to a detail page instead of opening WhatsApp directly:

```
Product card → "View Product" → /product/:slug → "Enquire on WhatsApp"
```

`/product/:slug` is one dynamic route serving the whole catalogue. The gallery
supports any number of images per product with thumbnail switching, and the
WhatsApp message is composed from the product's own data:

```
Hello Madhuri Jewellers,
I am interested in:
Product: Kasu Malai Long Haaram
Collection: Gold Jewellery
Purity: 22K · 916 BIS Hallmark
Weight: 48 – 86 g
Product URL: https://www.madhurijewellers.in/product/kasu-malai-long-haaram
```

The destination number comes from admin-managed site settings, not from code.

## No fallback data

`SITE_FALLBACK` has been removed. Business details — phones, WhatsApp, email,
address, hours, socials, rating — come from the API and from nowhere else.

The old behaviour seeded the header and footer with a hardcoded copy and kept
showing it when the request failed. That made an outage invisible and, worse,
printed contact details the shop might have changed months ago. A customer
ringing a disconnected number because the website was confidently wrong is a
real cost; a phone number that takes a moment to appear is not.

So `useSite()` returns `site: null` until the live settings arrive, and it stays
null if they never do. Each consumer renders a placeholder of the same height
while loading and omits the detail on failure, so the layout holds either way.
The contact page — the one people open *specifically* to find a phone number —
shows a visible error with a retry instead.

The same rule covers products, collections and the gallery: loading, empty and
error states, never invented content.

**Two things are still in the bundle, and neither is business data.**

`BRAND_NAME` and `SITE_URL` in `src/data/site.ts` are deployment constants used
for document titles and canonical URLs. They are not editable in the dashboard
and say nothing about how to contact the shop.

**Static marketing copy in `src/data/content.ts`** — testimonials, FAQs, offers,
the story, craftsmanship steps and trust points. These change rarely and read
better versioned with the site. Navigation menus are route structure and stay in
code as well.

## Images

Bundled assets in `src/assets/` still back the hero, the craftsmanship plate and
the about page — they are part of the design. Everything catalogue-related
arrives as a Cloudinary URL. Both go through `src/lib/media.ts`, which appends
`f_auto,q_auto` plus a width cap and typically halves the bytes on the wire.

The two are kept deliberately separate:

| Helper | For | When there is nothing |
| --- | --- | --- |
| `assetImage(key)` | bundled design artwork | always resolves |
| `remoteImage(url)` | admin-uploaded photography | returns `null` |
| `bannerImage(src)` | page banners, either kind | returns `null` |

The old helper substituted a *different piece of jewellery* from the bundle when
a product had no photograph. That is a correctness problem rather than a
cosmetic one — a customer would have been looking at one necklace under another
necklace's name and could enquire about the wrong piece. A missing photograph
now renders as a missing photograph, in a box that keeps its 4:5 ratio so the
grid does not reflow.

Offscreen images stay lazy; the first row of a grid and the product detail's
main photograph load eagerly. Every image carries width and height, which is
what keeps the page from shifting as photographs decode.

## Routes

Every previous route still works, including the twelve collection paths
(`/gold-jewellery`, `/bangles`, and so on). `/product/:slug` is the only
addition. `vercel.json` already rewrites unknown paths to `index.html`, so deep
links resolve.

## Validating

```bash
npm run typecheck
npm run lint
npm run build
```
