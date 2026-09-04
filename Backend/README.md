# Backend

The API behind both the public website and the admin dashboard. Node, Express
and TypeScript, with Supabase Postgres for data and Cloudinary for images.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Supabase

Create a project at [supabase.com](https://supabase.com), then from
**Project Settings → API** copy into `.env`:

| Variable                    | Where it comes from    | Exposure                  |
| --------------------------- | ---------------------- | ------------------------- |
| `SUPABASE_URL`              | Project URL            | Server only               |
| `SUPABASE_ANON_KEY`         | `anon` `public` key    | Server only, here         |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key     | **Server only — secret**  |

The service-role key bypasses Row Level Security. It must never appear in a
frontend, a `VITE_*` variable, or a repository.

### 3. Cloudinary

From your [Cloudinary](https://cloudinary.com) dashboard:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=     # secret — server only
CLOUDINARY_FOLDER=madhuri-jewellers
```

### 4. Redis (optional, but recommended)

Redis is the server-side cache in front of Supabase. It is **not** the source of
truth and is **not** required to run the API — with no Redis configured, every
read simply goes to Supabase, which is slower but entirely correct.

Locally, either works:

```bash
# Docker
docker run --name madhuri-redis -p 6379:6379 -d redis:7

# or a native install
redis-server
```

Then:

```env
REDIS_URL=redis://localhost:6379
```

In production, point it at a managed Redis over TLS. The `rediss://` scheme
turns TLS on automatically; no vendor is hardcoded anywhere:

```env
REDIS_URL=rediss://default:PASSWORD@your-host.example.com:6380
```

To run with no cache at all, set `REDIS_ENABLED=false`.

`REDIS_URL` normally contains a password. It is a backend secret in exactly the
way `SUPABASE_SERVICE_ROLE_KEY` is: never put it in a `VITE_*` variable, and
never log it. Nothing in this codebase prints a connection string, including in
error paths.

### 5. Migrations

Two SQL files live in `supabase/migrations`, applied in filename order:

| File                              | Contents                                            |
| --------------------------------- | --------------------------------------------------- |
| `…_init_schema.sql`               | Tables, enums, constraints, indexes, triggers        |
| `…_row_level_security.sql`        | RLS enablement and policies                          |

Apply them either way:

**Supabase CLI (recommended)**

```bash
supabase link --project-ref <your-ref>
supabase db push
```

**Or paste into the SQL editor** — open each file, paste, run in order.

**Or `npm run migrate`** — this posts each file to an `exec_sql` RPC. That
helper does not exist by default; create it once in the SQL editor if you want
to use this route:

```sql
create or replace function public.exec_sql(query text)
returns void language plpgsql security definer as $$
begin execute query; end; $$;

revoke all on function public.exec_sql(text) from public, anon, authenticated;
```

Drop that function again once you have finished migrating — an `exec_sql` RPC
is a large amount of power to leave sitting in a database.

### 6. Seed

```bash
# Set these first — the seed creates the dashboard login from them.
ADMIN_EMAIL=owner@madhurijewellers.in
ADMIN_PASSWORD=<a long unique password from your password manager>

npm run seed
```

The seed:

1. uploads the six source photographs to Cloudinary under fixed public IDs
2. inserts or updates 12 collections and their highlights
3. inserts or updates 72 products with their image records
4. inserts or updates 12 gallery items
5. writes the site settings row
6. creates the Supabase Auth user and its `admin_users` profile

**It is idempotent.** Collections and products key on slug, gallery on
`seed_key`, settings on the singleton constraint, and Cloudinary assets on
public ID. Running it twice updates; it does not duplicate. Existing Cloudinary
uploads are detected and skipped.

An existing admin's password is left alone on a re-run. To reset it deliberately:

```bash
RESET_ADMIN_PASSWORD=true npm run seed
```

Once the account exists you can blank `ADMIN_EMAIL` and `ADMIN_PASSWORD` — the
running API never reads them.

### 7. Run

```bash
npm run dev      # tsx watch, http://localhost:5000
npm run build    # compiles to dist/
npm start        # node dist/server.js
```

## Data model

```
collections ──┬── collection_highlights
              │
              └── products ── product_images
gallery_items
site_settings   (single row)
admin_users     (profile on top of auth.users)
```

Products reference collections with `on delete restrict`, so a populated
collection cannot be dropped by accident — the API asks you to reassign or
deactivate instead. Product images cascade, and their Cloudinary assets are
removed alongside the rows. A partial unique index guarantees at most one
primary image per product.

## API reference

All responses share one envelope:

```json
{ "success": true, "data": {} }
```

Lists add `meta`:

```json
{ "success": true, "data": [], "meta": { "page": 1, "limit": 20, "total": 72, "totalPages": 4 } }
```

Failures never leak internals:

```json
{ "success": false, "message": "Some fields need attention", "code": "validation_failed",
  "errors": [{ "field": "name", "message": "Give the piece a name" }] }
```

### Public — `/api/v1/public` · no authentication

| Method | Path                  | Notes                                        |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/collections`        | All active collections with product counts    |
| GET    | `/collections/:slug`  | One collection + highlights, products, related |
| GET    | `/products`           | `collection`, `badge`, `search`, `page`, `limit` |
| GET    | `/products/:slug`     | One product + images + related pieces         |
| GET    | `/new-arrivals`       | `is_new_arrival = true`                       |
| GET    | `/featured`           | `is_featured = true`                          |
| GET    | `/gallery`            | Optional `category`                           |
| GET    | `/site-settings`      | Public business information                   |

These are served through the **anon** Supabase client, so RLS applies to every
row returned, and every one of them is cached in Redis (see below).

Product listings are paged: `limit` defaults to **24** and is capped at **50**.
`/collections/:slug` ships the collection's first page of products with the hero
so the grid paints in one request; the website asks for further pages from
`/products?collection=…&page=2`.

`GET /health` reports application health without exposing any connection
detail:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 1284,
    "redis": "ok",
    "cache": { "hits": 4210, "misses": 173, "hitRate": 0.961, "...": "..." }
  }
}
```

`redis` is one of `ok`, `degraded`, `connecting` or `disabled`. This is a
**liveness** check: it stays `200` when Redis is degraded, because the API can
still serve every request from Supabase and restarting the container would fix
nothing.

### Auth — `/api/v1/auth`

| Method | Path       | Notes                                        |
| ------ | ---------- | -------------------------------------------- |
| POST   | `/login`   | Sets HTTP-only cookies, returns the profile   |
| GET    | `/me`      | The signed-in admin                           |
| POST   | `/refresh` | Rotates the session from the refresh cookie   |
| POST   | `/logout`  | Revokes and clears                            |

No token is ever returned in a response body.

### Admin — `/api/v1/admin` · session required

| Method    | Path                                  |
| --------- | ------------------------------------- |
| GET       | `/dashboard`                          |
| GET/POST  | `/products`                           |
| GET/PATCH/DELETE | `/products/:id`                |
| PATCH     | `/products/reorder`                   |
| POST      | `/products/:id/images`                |
| PATCH     | `/products/:id/images/order`          |
| PATCH     | `/products/:id/images/:imageId`       |
| PATCH     | `/products/:id/images/:imageId/primary` |
| DELETE    | `/products/:id/images/:imageId`       |
| GET/POST  | `/collections`                        |
| GET/PATCH/DELETE | `/collections/:id`             |
| POST      | `/collections/:id/banner`             |
| GET/POST  | `/gallery`                            |
| PATCH/DELETE | `/gallery/:id`                     |
| PATCH     | `/gallery/reorder`                    |
| GET/PATCH | `/site-settings`                      |

Deleting a collection that still holds products returns **409** with the count.
Pass `?reassignTo=<collectionId>` to move them and proceed.

## Architecture

```
src/
├── config/         env validation, logger, Supabase, Cloudinary, Redis clients
├── cache/          the Redis layer — keys, TTLs, cache-aside, invalidation
├── routes/         URL shape only
├── controllers/    request → service → response envelope
├── services/       business rules; the only place decisions are made
├── repositories/   database access, one module per table
├── middlewares/    auth, validation, uploads, errors, rate limits, HTTP cache
├── validators/     Zod schemas for every write
├── utils/          errors, pagination, slugs, response helpers
├── types/          database row types and API DTOs
└── constants/
```

Controllers hold no logic beyond unwrapping the request. Repositories select
named columns rather than `select *`, and product images are fetched for a whole
page in one query rather than per row.

## Caching

### The shape of it

```
        Frontend
           │
           ▼
      Backend service
           │
      ┌────┴─────┐
    HIT         MISS
     │            │
     │            ▼
     │        Supabase
     │            │
     │            ▼
     │       Redis SET
     │            │
     └─────┬──────┘
           ▼
      Public response
```

Redis is an accelerator, never a dependency. If it is unreachable the request
reads Supabase and returns live data — slower, correct, and invisible to the
visitor. The only thing a cache failure is ever allowed to cost is speed.

### Where the caching happens

At the **service layer**, not in a middleware:

```
controller → service → cache.getOrSet() → repository → Supabase
```

There is deliberately no "cache every GET" middleware. Caching Express
responses blindly would put the admin API one routing mistake away from being
served out of a shared public cache. Caching inside the service means the value
stored is the finished public DTO — the same object the controller was about to
serialise — so a cache hit and a database read are byte-identical, and a client
cannot tell which one it received.

Only public reads are cached. Admin responses are never cached, in Redis or by
any HTTP cache: every `/api/v1/admin` route sends `Cache-Control: no-store`, and
authentication middleware runs before any handler that could read from Redis.

### Keys

```
mj:production:public:products:collection=gold-jewellery:limit=24:page=1:v1#collections=…,products=…
└┬┘ └───┬────┘ └─┬──┘ └──────────────┬──────────────────────────┘ └┬┘ └──────────┬───────────────┘
 │      │        │                   │                            │              │
prefix  env    scope     normalised, sorted query               DTO ver     family versions
```

- **Namespaced per deployment**, so a staging instance sharing a managed Redis
  cannot serve production its own data.
- **Normalised**, so `?page=1&limit=24` and `?limit=24&page=1` are one entry,
  and `gold-jewellery` and `/Gold-Jewellery` resolve to the same key.
- **Versioned** (`:v1`) — bump `CACHE_DTO_VERSION` when a public DTO changes and
  every older entry is treated as a miss rather than deserialised wrongly.

Key builders live in `cache/cache.keys.ts`. No raw key strings appear anywhere
else in the codebase.

### Invalidation

Cache families are groups of entries that go stale together. Each owns a counter
in a single Redis hash, and a key embeds the counters of every family it depends
on. **Retiring a whole family is one `HINCRBY`** — no `KEYS`, no `SCAN`, no
maintained key sets, and correct across any number of API instances.

Counters seed from the clock rather than from zero, so if the hash is ever lost
to eviction or a flush, the new seed exceeds anything used before and a
surviving entry cannot become reachable again.

| Admin action | Families retired | Why |
| --- | --- | --- |
| Product created, edited or deleted | `products`, `collections` | Listings, detail pages, and the per-collection product counts on the collection cards |
| `is_new_arrival` set **or cleared** | + `newArrivals` | A piece leaving the list matters as much as one joining it |
| `is_featured` set **or cleared** | + `featured` | Same reasoning |
| Product images added, deleted, reordered, re-alt-texted, primary changed | `products`, `collections` | Images are embedded in every product DTO — cards, detail pages and the related strip |
| Product reorder | `products`, `collections`, `newArrivals`, `featured` | Reordering can change the first page of any list |
| Collection created, edited, banner changed | `collections`, `products` | A collection's name, slug and path are copied into every product DTO |
| Collection deleted (with reassignment) | all catalogue families | Products moved between collections |
| Gallery created, edited, reordered, deleted | `gallery` | |
| Site settings saved | `siteSettings` | |

Invalidation always runs **after** the database write has succeeded, so there is
never a window in which the cache is empty and the mutation later fails.

A failed invalidation does not fail the request — the data was saved, and
claiming otherwise would be a lie the admin acts on. It is counted and logged,
and the affected entries still expire on their TTL, which is the backstop.

### TTLs

Defined in `cache/cache.constants.ts`:

| Entry | TTL |
| --- | --- |
| `CACHE_TTL_COLLECTIONS` | 15 min |
| `CACHE_TTL_PRODUCTS` | 10 min |
| `CACHE_TTL_PRODUCT_DETAIL` | 10 min |
| `CACHE_TTL_NEW_ARRIVALS` | 5 min |
| `CACHE_TTL_FEATURED` | 10 min |
| `CACHE_TTL_GALLERY` | 15 min |
| `CACHE_TTL_SITE_SETTINGS` | 10 min |

TTLs are a safety net, not the freshness mechanism. Explicit invalidation is
what makes an admin edit visible on the very next request; the TTL only decides
how long an entry survives when nothing changes. No entry is ever stored without
one.

### Stampede protection

When a popular entry expires, one request loads it and the rest wait:

```
request 1 → MISS → takes the lock → queries Supabase → SET
request 2..500 → MISS → wait briefly for the result → served
```

Two layers do this: an in-process map coalescing concurrent callers within one
instance, and a short Redis lock (`SET NX PX`) coalescing across instances. A
waiter polls for at most ~900 ms and then loads for itself rather than stalling
indefinitely, so a stuck loader degrades into ordinary duplicate work rather
than a hung request.

Measured locally: **200 concurrent requests on an expired key produced one
database query.**

### HTTP caching versus Redis

`middlewares/cache.middleware.ts` sets `Cache-Control`. That is the *browser and
CDN* cache and it is a different mechanism from the one described above:

|  | Redis | HTTP cache |
| --- | --- | --- |
| Lives | server side, shared | browser / CDN |
| Purge on admin save | yes, immediately | impossible — it can only expire |
| Role | the authoritative application cache | absorbs bursts |

Public reads send `public, max-age=30, s-maxage=60, stale-while-revalidate=60`.
This is shorter than it once was on purpose: a long edge window is precisely
what would make an admin edit look like it had not taken effect. Redis now makes
the origin fast, so the edge does not need to carry the load. If you want edge
freshness to be instant, set `s-maxage=0` — the origin will still answer from
Redis in single-digit milliseconds.

### Failure behaviour

| Situation | What happens |
| --- | --- |
| Redis unreachable at boot | Warned once, reads go to Supabase, retries in the background |
| Redis drops mid-request | Command fails fast, request reads Supabase, returns `200` |
| Redis `SET` fails after a good query | Request still succeeds; counted and logged |
| Invalidation fails | Mutation still reported as saved; counted and logged; TTL is the backstop |
| Cached payload is corrupt | Treated as a miss, never parsed into a response |
| Redis **and** Supabase both down | Honest `5xx`. No invented data, ever |

`enableOfflineQueue` is off deliberately: a command issued while the socket is
down fails immediately instead of queueing until it times out. Reconnection uses
a capped backoff with jitter so an outage cannot spin the CPU or have every
instance retry in lockstep.

### Observability

Counters — hits, misses, bypasses, set failures, invalidation failures,
deserialisation failures, coalesced waits — are exposed on `/health`. Logs
record cache events at `debug` and invalidations at `info`, and never contain a
payload, a key's contents, a credential or a connection string.

### Production notes

```
CDN / Load balancer
        ↓
Multiple API instances  ──→  Managed Redis (TLS)
        ↓
     Supabase
```

Nothing is held in Node process memory as a cache, so instances scale
horizontally without coordination — they share one Redis and agree through the
family counters.

Set an eviction policy of **`volatile-lru`**. Every cache entry carries a TTL
and the family-version hash deliberately does not, so `volatile-lru` evicts
cache entries under memory pressure while leaving the version counters intact.
The application is correct either way — a missing entry is just a miss — but
this ordering avoids needlessly discarding the counters.

Redis is never treated as durable storage. Losing the whole instance costs a
brief period of slower responses and nothing else.

### Cache warming

Off by default. `CACHE_WARM_ON_STARTUP=true` warms exactly two entries at boot —
site settings and the collection list — because every page load requests them.
The catalogue is deliberately *not* warmed: loading every product on each deploy
would hammer Supabase for entries most of which nobody asks for. Cache-aside
handles the rest.

## Security notes

- Both Supabase clients are constructed here and never exported to a browser.
  Public reads use the anon key deliberately so RLS is genuinely enforced.
- `admin_users` has RLS enabled with **no policy**, which denies anon and
  authenticated access entirely — only the service role can read it.
- Uploads are checked for MIME type, extension and size before reaching
  Cloudinary, which then rejects anything that is not really an image. Files are
  streamed from memory; nothing is written to disk.
- The logger redacts any key matching `password|token|secret|key|authorization|
  cookie|credential|jwt|apikey` before writing.
- Postgres error codes are translated into plain sentences. Stack traces are
  logged, never returned.
- `REDIS_URL` carries the Redis password and is treated like any other backend
  secret: never logged, never returned in an error, never exposed on `/health`.
  Redis errors are reduced to an error code before they reach a log line.
- Only public, non-personalised data is cached. No token, cookie, credential or
  admin response is ever written to Redis, and no cache key is built from a
  secret.

### Cookies in production

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

If the dashboard sits on a different registrable domain from the API, set
`COOKIE_SAME_SITE=none` — which forces `Secure` on. Hosting both under one
domain (`api.example.com` and `admin.example.com`) is simpler and lets you keep
`lax`.

## Deployment

Any standard Node host works. Build with `npm run build`, start with
`npm start`, and set every variable from `.env.example` in the host's
configuration. Point `REDIS_URL` at a managed Redis (`rediss://` for TLS) and
give every instance the same one — that is what makes the cache shared rather
than per-process.

On `SIGTERM`/`SIGINT` the server stops accepting connections, lets in-flight
requests finish, closes Redis and exits, with a 10-second hard stop if something
refuses to let go. Set `PUBLIC_FRONTEND_URL` and `ADMIN_FRONTEND_URL` to the real
production origins — the CORS allow-list is built from them, and a wildcard is
never used.
