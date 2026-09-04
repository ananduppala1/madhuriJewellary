import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Express, type RequestHandler } from "express";
import helmetDefault, { type HelmetOptions } from "helmet";
import { cacheMetrics } from "./cache/cache.metrics.js";
import {
  allowAnyOrigin,
  envIssues,
  envIsValid,
  envIssueSummary,
  isOriginAllowed,
  isProduction,
  isServerless,
} from "./config/env.js";
import { logger } from "./config/logger.js";
import { redisHealth } from "./config/redis.js";
import { API_PREFIX } from "./constants/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { publicLimiter } from "./middlewares/rateLimit.middleware.js";
import { requestContext } from "./middlewares/requestContext.middleware.js";
import { apiRouter } from "./routes/index.js";
import { ApiError } from "./utils/ApiError.js";

/**
 * helmet publishes separate CommonJS and ESM type declarations. This build
 * resolves the ESM ones, where the default export is the middleware factory;
 * Vercel's function builder resolves the CommonJS ones, where the same import
 * widens to the module namespace and `helmet(...)` stops type-checking with
 * TS2349. The imported value is callable under either module system, so name
 * that one shape here. Options are still checked against helmet's own
 * `HelmetOptions`.
 */
const helmet = helmetDefault as unknown as (
  options?: Readonly<HelmetOptions>,
) => RequestHandler;

/**
 * Origins are matched against an explicit allow-list. `Access-Control-Allow-
 * Origin: *` is never sent, because the admin API relies on credentialed
 * requests and a wildcard would both break them and widen the surface. When the
 * allow-list itself is set to `*` the request's own origin is echoed back
 * instead, which keeps credentialed requests working.
 */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl and server-to-server calls have no Origin.
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(ApiError.forbidden("This origin is not allowed to call the API"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["x-request-id"],
  maxAge: 86_400,
};

/**
 * When a required variable is missing the API still starts, still answers
 * `/health`, and turns every other route into a 503 that names the variables at
 * fault. A deployment that reports its own misconfiguration in plain JSON is
 * far easier to fix than one that returns an opaque platform-level crash.
 */
const configurationGuard: RequestHandler = (_req, res, next) => {
  if (envIsValid) return next();

  res.status(503).json({
    success: false,
    code: "not_configured",
    message:
      "The API is deployed but not configured. Set the environment variables listed in " +
      "`missing`, then redeploy.",
    missing: envIssues.map((issue) => issue.variable),
    errors: envIssues.map((issue) => ({ field: issue.variable, message: issue.message })),
  });
};

export function createApp(): Express {
  const app = express();

  if (!envIsValid) {
    logger.error("Starting with an incomplete configuration", { issues: envIssueSummary() });
  }

  if (isProduction && allowAnyOrigin) {
    logger.warn(
      "EXTRA_ALLOWED_ORIGINS contains '*': every origin may call this API with credentials. " +
        "Replace it with the exact frontend URLs before going live.",
    );
  }

  // Behind a load balancer on every host this runs on, Vercel included; needed
  // for correct client IPs, which is what the rate limiter keys on. `1` rather
  // than `true` on purpose - a fully permissive setting lets a client forge
  // X-Forwarded-For and walk around the limiter.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API serves JSON only - it never renders HTML that could embed
      // scripts, and it must not be framed.
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "no-referrer" },
      hsts: isProduction ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    }),
  );

  app.use(cors(corsOptions));

  // Vercel's edge already compresses every response on the way out. Running
  // gzip a second time inside the function buys nothing, costs CPU on billed
  // execution time, and adds a layer that rewrites the response stream.
  if (!isServerless) app.use(compression());

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestContext);

  /**
   * Liveness, not readiness. The process is healthy whenever it can answer a
   * request, and it can answer requests without Redis - reads simply go to
   * Supabase instead. Reporting a degraded cache as a dead application would
   * have an orchestrator restart a container that is working perfectly well.
   *
   * Deliberately mounted above the configuration guard, so that an API missing
   * an environment variable can still say so here.
   *
   * Nothing here names a host, a URL or a credential.
   */
  app.get("/health", (_req, res) => {
    const cache = redisHealth();

    res.json({
      success: true,
      data: {
        status: envIsValid ? "ok" : "not_configured",
        uptime: Math.round(process.uptime()),
        configured: envIsValid,
        ...(envIsValid ? {} : { missing: envIssues.map((issue) => issue.variable) }),
        redis: cache,
        ...(cache === "disabled" ? {} : { cache: cacheMetrics.snapshot() }),
      },
    });
  });

  /** A friendly root, so the deployment URL is not a bare 404 in a browser. */
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "Madhuri Jewellers API",
        health: "/health",
        api: API_PREFIX,
        configured: envIsValid,
      },
    });
  });

  app.use(configurationGuard);

  app.use(publicLimiter);
  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * The single application instance.
 *
 * Vercel detects an Express app by looking for a default export (or a port
 * listener) in `src/app.ts`, `src/index.ts` or `src/server.ts`, in that order.
 * `src/app.ts` is the first file it checks, so the default export lives here
 * and the other two entry points re-use this same instance - one app, however
 * the process is started.
 */
const app = createApp();

export default app;
