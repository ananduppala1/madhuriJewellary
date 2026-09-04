import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { cacheMetrics } from "./cache/cache.metrics.ts";
import { allowedOrigins, isProduction } from "./config/env.ts";
import { redisHealth } from "./config/redis.ts";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.ts";
import { publicLimiter } from "./middlewares/rateLimit.middleware.ts";
import { requestContext } from "./middlewares/requestContext.middleware.ts";
import { apiRouter } from "./routes/index.ts";
import { ApiError } from "./utils/ApiError.ts";

/**
 * Origins are matched against an explicit allow-list. `Access-Control-Allow-
 * Origin: *` is never sent, because the admin API relies on credentialed
 * requests and a wildcard would both break them and widen the surface.
 */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl and server-to-server calls have no Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(ApiError.forbidden("This origin is not allowed to call the API"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["x-request-id"],
  maxAge: 86_400,
};

export function createApp(): Express {
  const app = express();

  // Behind a load balancer on most Node hosts; needed for correct client IPs,
  // which is what the rate limiter keys on.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API serves JSON only — it never renders HTML that could embed
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
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestContext);

  /**
   * Liveness, not readiness. The process is healthy whenever it can answer a
   * request, and it can answer requests without Redis — reads simply go to
   * Supabase instead. Reporting a degraded cache as a dead application would
   * have an orchestrator restart a container that is working perfectly well.
   *
   * Nothing here names a host, a URL or a credential.
   */
  app.get("/health", (_req, res) => {
    const cache = redisHealth();

    res.json({
      success: true,
      data: {
        status: "ok",
        uptime: Math.round(process.uptime()),
        redis: cache,
        ...(cache === "disabled" ? {} : { cache: cacheMetrics.snapshot() }),
      },
    });
  });

  app.use(publicLimiter);
  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
