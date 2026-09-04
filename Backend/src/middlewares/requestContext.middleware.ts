import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logger } from "../config/logger.js";

/**
 * Tags each request and logs a single line when it completes. No headers,
 * bodies or query values are recorded, so nothing sensitive reaches the log.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader("x-request-id", id);

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("request", {
      id,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      ms: Math.round(ms),
    });
  });

  next();
};
