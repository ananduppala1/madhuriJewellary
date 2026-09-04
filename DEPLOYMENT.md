# Deploying Madhuri Jewellers to Vercel

This repository holds three applications. Each one becomes its own Vercel project,
all pointing at the same Git repository, distinguished only by **Root Directory**.

| Vercel project | Root Directory | What it is |
| --- | --- | --- |
| `madhuri-shop` | `frontend` | Public website (Vite + React) |
| `madhuri-admin` | `AdminFrontend` | Admin dashboard (Vite + React) |
| `madhuri-api` | `Backend` | REST API (Express + Supabase + Cloudinary) |

The two frontends already deploy. This document explains why the backend did not,
what changed, and exactly how to deploy it.

---

## Part 1 — Why the backend was not deploying

The build was never the problem. On the original code, `npm run build` and
`npm run typecheck` both pass. The backend failed for a different reason.

### The main cause: Vercel could not find an application to run

Vercel does not run `npm start`. There is no long-lived process and no port to
bind — your app becomes a single function that Vercel invokes per request.

To find that app, Vercel looks for an Express application exported from one of a
fixed list of filenames, **in this order**:

```
app.*        index.*        server.*
src/app.*    src/index.*    src/server.*
```

The file must either export the app as a `default` export or call `app.listen()`.
Here is what was in `Backend/` before:

| File | Contents | Result |
| --- | --- | --- |
| `src/app.ts` | exported `createApp()`, a **factory** | checked **first**, no app found |
| `src/server.ts` | the only `app.listen()` | never reached |
| `vercel.json` | did not exist | no override |
| `api/` folder | did not exist | no function |

Vercel checks `src/app.ts`, finds a function that *makes* an app rather than an
app, and gives up on Express detection. It then falls back to the generic
**"Other"** preset, which assumes a static site: it runs `npm run build`, looks
for a folder of HTML to serve, and finds `dist/` full of compiled JavaScript
instead. That produces the failure you saw:

> No Output Directory named `public` found after the Build completed.

If the project's Output Directory happened to be set to something that exists,
the deployment "succeeds" and then returns 404 for every single route — which is
the other symptom people hit with this exact setup.

### Four more faults that would have broken it anyway

Even after giving Vercel an entry point, the code had four problems that only
appear once it is actually running serverless.

**1. A missing environment variable killed the function before it existed.**

`Backend/.env` is in `.gitignore`, so it was never pushed and does not exist on
Vercel. The old `config/env.ts` ended with:

```ts
throw new Error(`Invalid environment configuration:\n${missing}`);
```

at the top level of the module. A throw *during module loading* aborts the
function before it is constructed, so Vercel cannot attach your error to a
request. All you get is a generic `FUNCTION_INVOCATION_FAILED` — no variable
name, no schema message, nothing you can act on.

**2. The Redis cache was dead, and cost time on every cold start.**

`initRedis()` was called from exactly one place: `src/server.ts`. Vercel never
loads that file, so the client stayed `null` for the entire life of the
deployment. Every read went to Supabase and `/health` reported the cache as
`connecting` forever. Worse, `REDIS_URL` in your `.env` points at a host a
serverless function cannot reach, so ioredis' background reconnect loop kept
running inside the function.

**3. Every relative import carried a `.ts` extension.**

There were 164 of them, like `import { createApp } from "./app.ts"`. This is
legal for `tsc` and `tsx` given the old compiler flags, but it is an unusual form
that Vercel's function builder does not resolve. `.js` specifiers pointing at
`.ts` sources are the standard, portable spelling and every toolchain understands
them.

**4. CORS and cookies were configured for localhost only.**

`EXTRA_ALLOWED_ORIGINS=*` was compared with exact string equality, so it matched
no origin at all. Every request from your deployed frontends would have come back
`403`. And `COOKIE_SAME_SITE=lax` means the browser silently drops the admin
session cookie, because `madhuri-admin.vercel.app` and `madhuri-api.vercel.app`
are different sites. Login would appear to succeed and then every request after
it would be a `401`.

---

## Part 2 — What changed

### Entry points

**`src/app.ts`** — still exports `createApp()`, and now also creates the single
application instance and exports it as the default export. This is the file
Vercel checks first, so this is where the default export has to be.

```ts
const app = createApp();
export default app;
```

**`src/index.ts`** (new) — the canonical serverless entry. One line, no port:

```ts
export { default } from "./app.js";
```

**`src/server.ts`** — now imports that same instance rather than building its
own, and keeps everything that only makes sense for a long-lived process: the
port, signal handlers, graceful shutdown, Redis warm-up. Vercel never loads it;
`npm run dev` and `npm start` still do. One app, however it is started.

### Imports and TypeScript configuration

All 164 relative imports rewritten from `"./x.ts"` to `"./x.js"`. Both
`tsconfig.json` and `tsconfig.build.json` moved to `NodeNext` module resolution,
and the `allowImportingTsExtensions` / `rewriteRelativeImportExtensions` flags
that the old spelling required were removed. The emitted JavaScript is now
identical in shape to the source, which is what makes it portable.

### Configuration no longer crashes the deployment

`config/env.ts` still validates everything with the same Zod schema, but it no
longer throws at import time. It records what is wrong, substitutes inert
placeholders so `createClient(...)` in `supabase.ts` can still be constructed,
and exports `envIsValid` / `envIssues`.

`app.ts` then mounts a guard that turns every API route into a `503` naming the
variables at fault, while `/health` and `/` stay up so you can read the
diagnosis. Long-lived servers keep the old fail-fast behaviour through
`assertEnvOrExit()` in `server.ts` — a server that boots half-configured is worse
than one that refuses to start, but a *deployment* that reports its own problem
is far better than one that returns an opaque crash.

Deployed with nothing configured, you now get:

```json
{
  "success": false,
  "code": "not_configured",
  "message": "The API is deployed but not configured. Set the environment variables listed in `missing`, then redeploy.",
  "missing": ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
              "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
}
```

### Redis works serverless, or gets out of the way

`config/redis.ts` gained `ensureRedis()`, a lazy initialiser called from the
cache layer on first use instead of at boot. On a long-lived server the
connection was already opened and this is a null check; on Vercel it is what
makes the cache exist at all.

It also refuses to dial a loopback address when running serverless, because that
can only ever fail and costs a full connect timeout each cold start. Measured:
**130 ms and one warning line**, instead of a 5-second stall.

### CORS and cookies

`EXTRA_ALLOWED_ORIGINS` now accepts three forms:

| Form | Example | Behaviour |
| --- | --- | --- |
| exact | `https://madhurijewellers.in` | matched literally |
| wildcard | `https://*.vercel.app` | `*` matches **one** label |
| open | `*` | allow-list disabled, warns in production |

The wildcard is deliberately narrow. Verified behaviour for
`https://*.vercel.app`:

```
allowed   https://madhuri-shop.vercel.app
allowed   https://madhuri-git-feat-xyz.vercel.app     (preview builds)
blocked   https://madhuri.vercel.app.attacker.com     (suffix lookalike)
blocked   https://a.b.vercel.app                      (nested subdomain)
blocked   http://madhuri-shop.vercel.app              (wrong scheme)
```

The deployment's own hostnames (`VERCEL_URL`, `VERCEL_BRANCH_URL`,
`VERCEL_PROJECT_PRODUCTION_URL`) are allowed automatically, so preview
deployments — which get a fresh unguessable hostname every time — work without
you listing anything.

`compression()` is now skipped when running serverless. Vercel's edge already
compresses every response; running gzip again inside the function bought nothing,
cost billed CPU, and added a layer that rewrites the response stream.

### Full list of modified files

```
Backend/src/app.ts              default export, config guard, CORS, no double-gzip
Backend/src/index.ts            NEW — serverless entry point
Backend/src/server.ts           reuses the shared app, fail-fast env check
Backend/src/config/env.ts       non-fatal validation, wildcard CORS, isServerless
Backend/src/config/redis.ts     ensureRedis(), loopback guard
Backend/src/cache/cache.service.ts   uses ensureRedis() instead of getRedis()
Backend/tsconfig.json           NodeNext
Backend/tsconfig.build.json     NodeNext
Backend/.env.example            Vercel-specific guidance
Backend/src/**/*.ts             164 import specifiers: ".ts" → ".js"
Backend/scripts/**/*.ts         same
```

**There is deliberately no `Backend/vercel.json`.** Vercel's zero-configuration
Express support explicitly removes the need for rewrites or an `/api` folder, and
for backend frameworks you do not set a build command or an output directory —
Vercel finds the file that exports your app and applies the right settings
itself. Adding a config file here would only reintroduce the static-site
assumptions that broke the deployment in the first place. Project Settings are
where the two settings that matter live, and they are covered below.

---

## Part 3 — Deploying the backend, step by step

### Step 1 — Push the updated code

Unzip over your working copy, then:

```bash
git add -A
git commit -m "Make backend deployable on Vercel"
git push
```

### Step 2 — Start from a clean Vercel project

Your existing backend project has saved settings from the failed attempts —
most likely Framework Preset "Other" and an Output Directory that does not apply.
Those persist across deployments and will keep overriding correct behaviour.

Delete it and re-import:

1. Vercel dashboard → the backend project → **Settings → Advanced → Delete Project**.
2. **Add New → Project**, choose the same GitHub repository.
3. Before clicking Deploy, expand the settings and set:

   - **Root Directory:** `Backend`
   - **Framework Preset:** `Express`

   Leave Build Command, Output Directory and Install Command **empty / default**.
   Express is a backend preset; it has no output directory, and overriding the
   build is how you end up back at the original error.

Deleting is not strictly required — you can change the same two settings on the
existing project — but stale overrides are the most common reason a "fixed"
backend still fails, and a fresh import guarantees none are left.

### Step 3 — Add the environment variables

**Settings → Environment Variables.** Tick **Production**, **Preview** and
**Development** for each one.

Required — the API returns `503` listing any that are missing:

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — bypasses RLS, server only |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary → Product Environment Credentials |
| `CLOUDINARY_API_KEY` | same page |
| `CLOUDINARY_API_SECRET` | same page — server only |

Required for the admin dashboard to be able to log in at all:

| Variable | Value |
| --- | --- |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAME_SITE` | `none` |

Set these once you know your frontend URLs (Step 5 comes back to this):

| Variable | Value |
| --- | --- |
| `PUBLIC_FRONTEND_URL` | `https://your-shop.vercel.app` |
| `ADMIN_FRONTEND_URL` | `https://your-admin.vercel.app` |
| `EXTRA_ALLOWED_ORIGINS` | `https://*.vercel.app` |

Recommended:

| Variable | Value | Why |
| --- | --- | --- |
| `CLOUDINARY_FOLDER` | `madhuri-jewellers` | keeps uploads tidy |
| `LOG_LEVEL` | `info` | |
| `REDIS_ENABLED` | `false` | until you have a hosted Redis; see Part 5 |
| `MAX_UPLOAD_SIZE_MB` | `8` | |

**Do not set these on Vercel:**

| Variable | Why not |
| --- | --- |
| `PORT` | the platform owns the socket |
| `NODE_ENV` | Vercel sets it to `production` |
| `COOKIE_DOMAIN` | `vercel.app` is on the Public Suffix List — a cookie scoped to `.vercel.app` is rejected by the browser outright. Leave it blank for host-only cookies, which is what you want. Only set it once both apps live under one real domain you own. |
| `REDIS_URL` (localhost) | unreachable from a function |

### Step 4 — Deploy and verify the API on its own

Deploy, then open the deployment URL in a browser. You should see:

```json
{ "success": true,
  "data": { "name": "Madhuri Jewellers API", "health": "/health",
            "api": "/api/v1", "configured": true } }
```

Then check `/health`:

```bash
curl https://your-api.vercel.app/health
```

```json
{ "success": true,
  "data": { "status": "ok", "configured": true, "redis": "disabled" } }
```

`"configured": true` is the important field. If it is `false`, the response also
contains a `missing` array naming exactly which variables to add — add them and
redeploy.

Then confirm real data flows:

```bash
curl https://your-api.vercel.app/api/v1/public/site-settings
```

### Step 5 — Point the frontends at the API, and the API back at them

**Public site project** (`frontend`) → Environment Variables:

```
VITE_API_BASE_URL = https://your-api.vercel.app
```

**Admin project** (`AdminFrontend`) → Environment Variables:

```
VITE_API_BASE_URL    = https://your-api.vercel.app
VITE_PUBLIC_SITE_URL = https://your-shop.vercel.app
```

No trailing slash on any of these; the client appends `/api/v1` itself.

> **`VITE_*` values are baked into the JavaScript bundle at build time.** Setting
> them is not enough — you must **redeploy both frontends** afterwards. This
> catches almost everyone: the variable is visibly set in the dashboard and the
> site still calls `localhost:5000`, because it is serving a bundle built before
> you added it.

Now go back to the **backend** project and set `PUBLIC_FRONTEND_URL`,
`ADMIN_FRONTEND_URL` and `EXTRA_ALLOWED_ORIGINS` to the real URLs, then redeploy
the backend once.

### Step 6 — Create the admin login

The seed script creates the dashboard account. Vercel will not run it — run it
locally against your production Supabase project:

```bash
cd Backend
# .env must hold the production SUPABASE_* values plus ADMIN_EMAIL / ADMIN_PASSWORD
npm run migrate
npm run seed
```

Blank out `ADMIN_PASSWORD` afterwards.

---

## Part 4 — Verification checklist

| # | Check | Expected |
| --- | --- | --- |
| 1 | `GET https://your-api.vercel.app/` | JSON, `configured: true` |
| 2 | `GET .../health` | `status: "ok"` |
| 3 | `GET .../api/v1/public/site-settings` | real data, `200` |
| 4 | Public site loads products | no CORS errors in the console |
| 5 | Admin login | succeeds, and a reload keeps you signed in |
| 6 | Admin image upload | file appears in Cloudinary |
| 7 | Edit a product, reload the public site | change is visible |

Check 5 is the one that catches cookie problems. If login works but a refresh
signs you out, `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` are not both set.

---

## Part 5 — Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `No Output Directory named "public" found` | Framework Preset is **Other**, not Express | Settings → General → Framework Preset → **Express**; clear any Output Directory override |
| Every route 404s, build succeeded | Vercel treated the project as a static site | same as above; confirm Root Directory is `Backend` |
| `503` with `code: "not_configured"` | missing environment variables | the `missing` array names them; add and redeploy |
| `FUNCTION_INVOCATION_FAILED` | a genuine runtime crash | Vercel → Deployment → **Logs**; the request-id in the log matches the `x-request-id` header |
| Frontend gets a CORS error | frontend URL not in the allow-list | set `EXTRA_ALLOWED_ORIGINS=https://*.vercel.app` on the **backend**, redeploy |
| Frontend calls `localhost:5000` | `VITE_API_BASE_URL` set but not rebuilt | redeploy the frontend |
| Login succeeds, next request is `401` | cross-site cookie dropped | `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=none`, `COOKIE_DOMAIN` unset |
| API returns a Vercel **login HTML page** instead of JSON | Deployment Protection | Settings → **Deployment Protection** → disable Vercel Authentication for Preview, or use the production URL |
| `/health` shows `redis: "degraded"` | Redis unreachable | harmless — reads go to Supabase. Set `REDIS_ENABLED=false` to silence it |
| Uploads fail over ~4 MB | Vercel request body limit | lower `MAX_UPLOAD_SIZE_MB`, or upload to Cloudinary directly from the browser |

### If Express is not offered as a Framework Preset

Zero-config Express detection is current and is what this code targets. If your
account somehow does not offer it, the older `/api` pattern still works. Add
`Backend/api/index.js`:

```js
export { default } from "../dist/app.js";
```

and `Backend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

then create `Backend/public/.gitkeep` so the output directory exists. The entry
is plain JavaScript importing already-compiled output on purpose: it keeps
Vercel's function builder away from TypeScript entirely. Use this only as a
fallback — the zero-config path is simpler and better supported.

---

## Part 6 — Things worth knowing

**Rate limiting is per-instance.** `express-rate-limit` keeps its counters in
memory, and Vercel runs several instances. The effective limit is therefore
`RATE_LIMIT_MAX × instances`. It still blunts a single abusive client, but it is
not a precise global quota. A shared store (Redis, or Vercel Firewall rules)
would fix it if that ever matters.

**Redis is optional, and off is a valid answer.** The cache only makes public
reads faster; if it is absent the API serves live data from Supabase. If you do
want it, use a hosted provider with a `rediss://` URL (TLS is then configured
automatically) — the code is not tied to any vendor. Set `REDIS_ENABLED=false`
until then, so the intent is explicit rather than looking like a broken
connection in `/health`.

**`multer@1.4.5-lts.2` has published advisories.** I left it alone because a 2.x
upgrade touches the upload paths and I did not want to bundle an untested change
into a deployment fix. Worth scheduling separately, with the admin image upload
flows tested afterwards.

**Cold starts.** The first request after a period of inactivity pays for module
loading and the Supabase client construction — typically a few hundred
milliseconds. Fluid compute reduces how often this happens.

**Custom domains.** Once the API and the dashboard sit under one registrable
domain (`api.madhurijewellers.in` and `admin.madhurijewellers.in`), you can
switch to `COOKIE_SAME_SITE=lax` and set `COOKIE_DOMAIN=.madhurijewellers.in`,
which is a stronger position than cross-site `SameSite=none` cookies.

---

## Verified before shipping

- `npx eslint .` — clean
- `npx tsc --noEmit` — clean
- `npm run build` — clean
- Deployed-but-unconfigured: `/` and `/health` return `200` with
  `configured: false`; API routes return `503` naming all six missing variables
- Fully configured: routes mount, allowed origins get the correct
  `Access-Control-Allow-Origin`, disallowed origins get `403`
- Wildcard origin matching verified against suffix-lookalike, nested-subdomain
  and wrong-scheme attacks
- Loopback Redis under `VERCEL=1`: disabled in 130 ms, no stall
- `npm run dev` (tsx) and `node dist/server.js` both still work; the latter exits
  `1` with the missing variables named when configuration is incomplete
