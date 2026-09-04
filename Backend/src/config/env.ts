import "dotenv/config";
import { z } from "zod";

/**
 * Every environment variable the API reads passes through this schema once, at
 * boot. If something required is missing the process refuses to start rather
 * than failing later on a request — and the error names the variable without
 * ever printing its value.
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

  /* Supabase — service role is server-only and must never reach a browser. */
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(20, "SUPABASE_ANON_KEY is missing"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY is missing"),

  /* Cloudinary — the API secret is server-only. */
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
   * Redis — the shared server-side cache in front of Supabase.
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

function load(): Env {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `  · ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${missing}\n\nSee .env.example.`);
  }

  return parsed.data;
}

export const env = load();

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";

/** Origins permitted to call this API with credentials. */
export const allowedOrigins: string[] = Array.from(
  new Set(
    [
      env.PUBLIC_FRONTEND_URL,
      env.ADMIN_FRONTEND_URL,
      ...env.EXTRA_ALLOWED_ORIGINS,
      ...(isProduction
        ? []
        : ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"]),
    ].filter(Boolean),
  ),
);

export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

/**
 * Caching is on only when it was asked for *and* somewhere to connect was
 * given. Asking for Redis without a URL is a configuration slip, not a reason
 * to refuse to serve traffic, so it downgrades to "no cache" and says so once.
 */
export const cacheEnabled: boolean = env.REDIS_ENABLED && Boolean(env.REDIS_URL);
