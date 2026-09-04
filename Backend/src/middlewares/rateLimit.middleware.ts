import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env.ts";
import { ApiError } from "../utils/ApiError.ts";

const shared: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(ApiError.tooMany()),
};

/** Broad ceiling for the public catalogue endpoints. */
export const publicLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** Tight limit on credential endpoints to blunt password guessing. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) =>
    next(ApiError.tooMany("Too many sign-in attempts. Try again in a few minutes.")),
});

/** Writes are cheaper to abuse than reads, so admin mutations get their own bucket. */
export const adminWriteLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 60,
});

/** Uploads hit Cloudinary, so they are limited harder still. */
export const uploadLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 30,
});
