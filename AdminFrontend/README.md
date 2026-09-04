# Admin Frontend

The dashboard the shop uses to manage the website. React 19, TypeScript, Vite,
React Router and Tailwind CSS.

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5174
```

The Backend must be running and seeded — the seed creates your login from
`ADMIN_EMAIL` and `ADMIN_PASSWORD` in `Backend/.env`.

## Configuration

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

Both are public values compiled into the bundle. There is no Supabase key, no
Cloudinary key and no credential here by design.

## Signing in

Go to `/login` and use the seeded email and password. On success the Backend
sets two HTTP-only cookies and the app redirects to `/dashboard`.

**Nothing sensitive is stored in the browser.** The session lives in cookies
JavaScript cannot read. No token is written to `localStorage` or
`sessionStorage`, and none is returned in the login response body — the API
replies with the admin profile only.

When an access token expires the API client refreshes once transparently and
retries. If that fails the session is dropped and you are returned to `/login`.

## Screens

| Route                   | What it does                                             |
| ----------------------- | -------------------------------------------------------- |
| `/login`                | Email and password                                       |
| `/dashboard`            | Real counts, recently edited products and collections     |
| `/products`             | Searchable, filterable table with pagination              |
| `/products/new`         | Create a product                                          |
| `/products/:id/edit`    | Edit, plus multi-image management                         |
| `/collections`          | List with product counts                                  |
| `/collections/new`      | Create a collection                                       |
| `/collections/:id/edit` | Edit, highlights, SEO, banner upload                      |
| `/gallery`              | Upload, caption, categorise, reorder, hide, delete        |
| `/site-settings`        | Contact details, address, hours, socials, rating          |

## Product images

Upload several at once by dragging onto the drop zone or choosing files. For
each image you can set it as primary, reorder it, edit its alt text, or delete
it. The first image a product receives becomes its primary automatically, and
deleting the primary promotes the next one rather than leaving the product
without a cover.

Reordering uses explicit move buttons rather than drag-and-drop — dragging is
pleasant with a mouse and close to unusable with a keyboard or on a phone, and
these lists are short enough that two buttons are faster.

## Deleting safely

Every destructive action asks first. Deleting a collection that still holds
products is refused by the API; the dialog turns that into a choice by asking
which collection the products should move to. Deleting a product or a gallery
item also removes the associated Cloudinary assets.

## Accessibility

Every field has a real `<label>`, errors are wired through `aria-describedby`
and `aria-invalid`, dialogs trap focus and restore it on close, focus rings are
never removed, and the layout works down to a phone. Icon-only buttons carry
screen-reader text.

## Validating

```bash
npm run typecheck
npm run lint
npm run build
```

## Deployment

A static SPA — deploy `dist/` to any static host. Two things must line up:

1. `VITE_API_BASE_URL` points at the production API.
2. The API's `ADMIN_FRONTEND_URL` names this app's exact origin, or CORS will
   reject it.

Configure the host to rewrite unknown paths to `index.html` so `/products/…`
resolves on a hard refresh. If the dashboard and API sit on different
registrable domains, the Backend needs `COOKIE_SAME_SITE=none` and
`COOKIE_SECURE=true` for the session cookies to be sent at all.

The dashboard ships with `noindex, nofollow`; keep it off public search.
