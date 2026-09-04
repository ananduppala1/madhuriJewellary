import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { isProduction } from "../config/env.ts";
import { logger } from "../config/logger.ts";
import { ApiError, isApiError } from "../utils/ApiError.ts";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.path}`));
};

type Normalised = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Everything a client sees about a failure is decided here. Stack traces,
 * Postgres error codes, Supabase internals and Cloudinary responses are logged
 * server-side and replaced with a readable sentence on the way out.
 */
function normalise(error: unknown): Normalised {
  if (isApiError(error)) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      code: "validation_failed",
      message: "Some fields need attention",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return { status: 413, code: "payload_too_large", message: "That image is too large" };
    }
    if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      return { status: 400, code: "bad_request", message: "Too many files in one upload" };
    }
    return { status: 400, code: "bad_request", message: "That upload could not be read" };
  }

  if (error instanceof SyntaxError && "body" in error) {
    return { status: 400, code: "bad_request", message: "Request body is not valid JSON" };
  }

  return { status: 500, code: "internal_error", message: "Something went wrong" };
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const result = normalise(error);

  const meta = {
    method: req.method,
    path: req.originalUrl.split("?")[0],
    status: result.status,
    code: result.code,
  };

  if (result.status >= 500) {
    logger.error(error instanceof Error ? error.message : "Unhandled error", {
      ...meta,
      stack: !isProduction && error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn(result.message, meta);
  }

  if (res.headersSent) return;

  res.status(result.status).json({
    success: false,
    message: result.message,
    code: result.code,
    ...(result.details === undefined ? {} : { errors: result.details }),
  });
};
