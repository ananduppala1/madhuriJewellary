# Madhuri Jewellers

A jewellery showroom website with an admin dashboard, built as three
independently deployable applications around one API.

```
madhurijewellers/
│
├── frontend/          Public website        (React 19 · Vite · Tailwind)
├── Backend/           REST API              (Node · Express · TypeScript)
└── Admin Frontend/    Admin dashboard       (React 19 · Vite · Tailwind)
```

## How the pieces fit together

```
        ┌──────────────────┐          ┌──────────────────┐
        │  Public website  │          │ Admin dashboard  │
        │   frontend/      │          │ Admin Frontend/  │
        └────────┬─────────┘          └────────┬─────────┘
                 │                             │
          public API (read)          protected API (read/write)
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                     ┌─────────────────────┐
                     │       Backend       │
                     │  Express · MVC      │
                     └─────┬─────────┬─────┘
                           │         │
              ┌────────────┘         └────────────┐
              ▼                                   ▼
      ┌───────────────┐                    ┌────────────┐
      │     Redis     │                    │ Cloudinary │
      │ read-through  │                    │   images   │
      │     cache     │                    └────────────┘
      └───────┬───────┘
              │ miss
              ▼
      ┌───────────────┐
      │   Supabase    │
      │   Postgres    │
      │ source of truth│
      └───────────────┘
```

Read path — the public website:

```
Public frontend → Backend → Redis HIT ─────────────→ response
                                └── MISS → Supabase → Redis SET → response
```

Write path — the dashboard:

```
Admin frontend → protected Backend API
                       ├── Supabase mutation
                       ├── Cloudinary mutation
                       ▼
                 (only after both succeed)
                 Redis invalidation
                       ▼
        next public request → MISS → fresh Supabase data → Redis repopulated
```

Supabase is the only database and the only source of truth. Cloudinary holds
every image; the database stores image *metadata* and never binary data. Redis
is a **derived cache** — it may be empty, stale for a moment, or entirely
absent, and the site keeps working either way. The Backend is the single
boundary: no browser ever talks to Supabase, Cloudinary or Redis directly, and
no credential for any of them reaches a client bundle.

## What is dynamic and what is not

**Managed in the dashboard** — collections, products, product images, new-arrival
and featured flags, gallery items, and the business contact details (phones,
WhatsApp, email, address, hours, socials, map).

**Deliberately still in code** — testimonials, FAQs, offers, the about/story
copy, craftsmanship steps and trust points. These are marketing copy that changes
rarely and reads better versioned with the site than typed into a form. The
navigation menus are route structure, not content, and stay in code too.

**Never guessed.** There is no fallback copy for anything in the first list. If
the API cannot be reached, the website shows a loading, empty or error state —
it does not fall back to a bundled phone number, address, or product list. A
hardcoded contact detail that survives an outage is worse than a blank one,
because a customer will ring a number the shop may have changed months ago. The
only things baked into the bundle are the brand name and the canonical URL,
which are deployment constants rather than editable business data.

## Getting started

You will need Node 20+, a Supabase project and a Cloudinary account.

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env          # then fill it in — see Backend/README.md

# Optional but recommended — the read cache. The API runs without it.
docker run --name madhuri-redis -p 6379:6379 -d redis:7

npm run migrate               # or paste supabase/migrations/*.sql into the SQL editor
npm run seed                  # loads the 12 collections, 72 products, 12 gallery items
npm run dev                   # http://localhost:5000
```

`npm run seed` also creates the dashboard login from `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in your `.env`. It is idempotent — running it twice updates
rather than duplicates.

### 2. Public website

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000
npm run dev                   # http://localhost:5173
```

### 3. Admin dashboard

```bash
cd "Admin Frontend"
npm install
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000
npm run dev                   # http://localhost:5174
```

Sign in at <http://localhost:5174/login> with the `ADMIN_EMAIL` and
`ADMIN_PASSWORD` you set for the seed.

### Ports

| Application    | Port | Configure with              |
| -------------- | ---- | --------------------------- |
| Public website | 5173 | Vite default                |
| Backend        | 5000 | `PORT` in `Backend/.env`    |
| Admin frontend | 5174 | `vite.config.ts`            |
| Redis          | 6379 | `REDIS_URL` in `Backend/.env` |

The Backend's CORS allow-list must name both frontend origins — see
`PUBLIC_FRONTEND_URL` and `ADMIN_FRONTEND_URL`.

## Validating a checkout

Each application checks itself the same way:

```bash
npm run typecheck && npm run lint && npm run build
```

## Security posture in one page

- The Supabase **service-role key** and the **Cloudinary API secret** exist only
  in `Backend/.env`. Neither appears in any `VITE_*` variable or client bundle.
- Admin sessions are **HTTP-only cookies**. No token is written to
  `localStorage`, `sessionStorage`, or the login response body.
- Every protected endpoint verifies the session **server-side** and then checks
  for an active row in `admin_users`. Route guards in the dashboard are a
  convenience, not the control.
- **Row Level Security** is enabled on every table. Public reads go through the
  anon key so the policies are exercised in production, not merely declared.
  No table has an insert, update or delete policy — all writes go through the
  API. `admin_users` has no policy at all and is service-role only.
- Write bodies are validated by strict Zod schemas; an unrecognised key is a
  400, so an admin client cannot set columns it should not.
- Helmet, a per-origin CORS allow-list (never `*`), and four separate rate-limit
  buckets are applied.
- There is **no admin password anywhere in the source**. The seed reads it from
  the environment and never prints it.
- **Redis holds only public data.** No token, cookie, credential or admin
  response is ever cached, no cache key is built from a secret, and `REDIS_URL`
  — which carries the Redis password — is a backend-only value that is never
  logged or returned in an error.

## Documentation

- [`Backend/README.md`](Backend/README.md) — environment, Supabase, Cloudinary
  and Redis setup, migrations, seeding, the full API reference, and the caching
  architecture: keys, TTLs, what each admin action invalidates, and how the
  system behaves when Redis fails.
- [`frontend/README.md`](frontend/README.md) — how the website consumes the API.
- [`Admin Frontend/README.md`](Admin%20Frontend/README.md) — dashboard setup and
  deployment.
