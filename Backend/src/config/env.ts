import "dotenv/config";
import { z } from "zod";

/**
 * Every environment variable the API reads passes through this schema once, at
 * boot.
 *
 * Two different things want to happen when a variable is missing, and which one
 * is right depends on where the process is running:
 *
 *  - On a long-lived server (`npm run dev`, `npm start`, a VPS, a container) the
 *    right answer is to refuse to start. A half-configured API that boots and
 *    then fails on the first request is harder to diagnose than one that never
 *    came up. `assertEnvOrExit()` in server.ts does exactly that.
 *
 *  - On a serverless host such as Vercel there is no boot step to fail in. A
 *    module-level `throw` there aborts the function *while it is being loaded*,
 *    and the platform can only report a generic crash - no variable name, no
 *    schema message, nothing actionable in the log. So the module records what
 *    is wrong, substitutes inert placeholders so imports further down the tree
 *    (Supabase, Cloudinary) can still be constructed, and lets `app.ts` answer
 *    every request with a 503 that names the missing variables.
 *
 * In both cases the error names the variable and never prints its value.
 */

const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined ? fallback : value.toLowerCase() === "true"));

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  /* Supabase - service role is server-only and must never reach a browser. */
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(20, "SUPABASE_ANON_KEY is missing"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is missing"),

  /* Cloudinary - the API secret is server-only. */
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is missing"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is missing"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is missing"),
  CLOUDINARY_FOLDER: z.string().default("madhuri-jewellers"),

  /* CORS origins. */
  PUBLIC_FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  ADMIN_FRONTEND_URL: z.string().url().default("http://localhost:5174"),
  EXTRA_ALLOWED_ORIGINS: csv,

  /* Cookies. */
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: bool(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  /* Rate limiting. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  /* Uploads. */
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().max(25).default(8),

  /**
   * Redis - the shared server-side cache in front of Supabase.
   *
   * Everything here is optional on purpose. The API is designed to run with no
   * Redis at all (every read simply goes to Supabase), so a missing or wrong
   * value degrades performance rather than stopping the process from booting.
   * `rediss://` in the URL turns on TLS; nothing about the connection is
   * hardcoded to a particular vendor.
   */
  REDIS_ENABLED: bool(true),
  REDIS_URL: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default("mj"),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).default(5_000),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(1_000),
  REDIS_MAX_RETRIES_PER_REQUEST: z.coerce.number().int().min(0).max(10).default(1),
  REDIS_MAX_RECONNECT_DELAY_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
  REDIS_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().max(86_400).default(300),
  /** Only ever set to false against a self-signed certificate in development. */
  REDIS_TLS_REJECT_UNAUTHORIZED: bool(true),
  /** Populate the two cheapest cache entries at boot. Off by default. */
  CACHE_WARM_ON_STARTUP: bool(false),

  /* Seed-only administrator bootstrap. Never read by the running API. */
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),
  ADMIN_NAME: z.string().optional(),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;

/**
 * True on Vercel (and settable by hand for any other function-per-request
 * host). The platform injects `VERCEL=1` at build time and at runtime.
 */
export const isServerless: boolean =
  process.env["VERCEL"] === "1" || process.env["SERVERLESS"] === "true";

/**
 * Values good enough to construct a client with, and useless for anything else.
 * They exist only so that `createClient(...)` at the top of supabase.ts does not
 * throw while the app is starting up misconfigured - no request ever reaches
 * those clients, because the guard in app.ts answers 503 first.
 */
const PLACEHOLDERS: Record<string, string> = {
  SUPABASE_URL: "https://not-configured.supabase.co",
  SUPABASE_ANON_KEY: "not-configured-anon-key-placeholder",
  SUPABASE_SERVICE_ROLE_KEY: "not-configured-service-role-key-placeholder",
  CLOUDINARY_CLOUD_NAME: "not-configured",
  CLOUDINARY_API_KEY: "not-configured",
  CLOUDINARY_API_SECRET: "not-configured",
};

export type EnvIssue = { variable: string; message: string };

type LoadResult = { env: Env; issues: EnvIssue[] };

function load(): LoadResult {
  const first = schema.safeParse(process.env);
  if (first.success) return { env: first.data, issues: [] };

  const issues: EnvIssue[] = first.error.issues.map((issue) => ({
    variable: issue.path.join(".") || "(root)",
    message: issue.message,
  }));

  // Replace only the variables that actually failed, then re-parse. Everything
  // the operator did set correctly is preserved.
  const patched: Record<string, string | undefined> = { ...process.env };
  for (const issue of issues) {
    patched[issue.variable] = PLACEHOLDERS[issue.variable] ?? "not-configured";
  }

  const second = schema.safeParse(patched);
  if (second.success) return { env: second.data, issues };

  // Belt and braces: a configuration every value of which is a placeholder.
  const third = schema.safeParse({ ...PLACEHOLDERS });
  if (third.success) return { env: third.data, issues };

  // Unreachable unless the schema itself is broken.
  throw new Error("Environment schema could not produce a fallback configuration");
}

const result = load();

export const env: Env = result.env;

/** Empty when the configuration is complete and valid. */
export const envIssues: readonly EnvIssue[] = result.issues;
export const envIsValid: boolean = result.issues.length === 0;

/** One-line, value-free summary suitable for a log or an HTTP response. */
export function envIssueSummary(): string {
  return envIssues.map((issue) => `${issue.variable}: ${issue.message}`).join("; ");
}

/**
 * Fail-fast for long-lived processes. Serverless entry points deliberately do
 * not call this - see the note at the top of the file.
 */
export function assertEnvOrExit(): void {
  if (envIsValid) return;

  const lines = envIssues.map((issue) => `  - ${issue.variable}: ${issue.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${lines}\n\nSee .env.example.`);
  process.exit(1);
}

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

/* -- CORS allow-list ---------------------------------------- */

/**
 * Origins Vercel knows this deployment by. Every preview deployment gets a
 * fresh, unguessable hostname, so hardcoding them is impossible and leaving
 * them out means the API rejects requests from its own preview URL.
 */
function vercelOrigins(): string[] {
  const hosts = [
    process.env["VERCEL_URL"],
    process.env["VERCEL_BRANCH_URL"],
    process.env["VERCEL_PROJECT_PRODUCTION_URL"],
  ].filter((host): host is string => Boolean(host));

  return hosts.map((host) => `https://${host.replace(/^https?:\/\//, "")}`);
}

const configuredOrigins: string[] = Array.from(
  new Set(
    [
      env.PUBLIC_FRONTEND_URL,
      env.ADMIN_FRONTEND_URL,
      ...env.EXTRA_ALLOWED_ORIGINS,
      ...vercelOrigins(),
      ...(isProduction
        ? []
        : ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"]),
    ]
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  ),
);

/** Kept for anything that wants to display or log the configured list. */
export const allowedOrigins: string[] = configuredOrigins;

/**
 * A lone `*` switches the allow-list off entirely. It is accepted because it is
 * genuinely useful while a deployment is being wired up, and app.ts logs a
 * warning in production because credentialed CORS plus an open allow-list is
 * not something anyone should end up with by accident.
 */
export const allowAnyOrigin: boolean = configuredOrigins.includes("*");

/**
 * Wildcard entries such as `https://*.vercel.app` are compiled to anchored
 * regexes. `*` matches within a single label only, so `https://*.vercel.app`
 * matches `https://madhuri-api.vercel.app` but not a nested subdomain and not
 * an origin that merely contains the suffix somewhere.
 */
function toPattern(origin: string): RegExp {
  // Split on the wildcard first, escape each literal segment, then rejoin with
  // the one pattern fragment. Escaping the whole string and substituting
  // afterwards would mean handling an escaped `*`, which is fiddlier and easy
  // to get subtly wrong.
  const body = origin
    .split("*")
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[^.]+");

  return new RegExp(`^${body}$`);
}

const exactOrigins = new Set(configuredOrigins.filter((origin) => !origin.includes("*")));
const patternOrigins = configuredOrigins
  .filter((origin) => origin.includes("*") && origin !== "*")
  .map(toPattern);

export function isOriginAllowed(origin: string): boolean {
  if (allowAnyOrigin) return true;
  const normalised = origin.replace(/\/+$/, "");
  if (exactOrigins.has(normalised)) return true;
  return patternOrigins.some((pattern) => pattern.test(normalised));
}

export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/**
 * Caching is on only when it was asked for *and* somewhere to connect was
 * given. Asking for Redis without a URL is a configuration slip, not a reason
 * to refuse to serve traffic, so it downgrades to "no cache" and says so once.
 */
export const cacheEnabled: boolean = env.REDIS_ENABLED && Boolean(env.REDIS_URL);
