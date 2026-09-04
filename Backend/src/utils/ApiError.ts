/**
 * Operational errors — ones we chose to raise and whose message is safe to show
 * a client. Anything else reaching the error handler is treated as unexpected
 * and reported as a generic 500.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code = "error", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request", details?: unknown) {
    return new ApiError(400, message, "bad_request", details);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "unauthorized");
  }

  static forbidden(message = "You do not have access to this resource") {
    return new ApiError(403, message, "forbidden");
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message, "not_found");
  }

  static conflict(message = "That already exists", details?: unknown) {
    return new ApiError(409, message, "conflict", details);
  }

  static payloadTooLarge(message = "File is too large") {
    return new ApiError(413, message, "payload_too_large");
  }

  static unsupportedMedia(message = "Unsupported file type") {
    return new ApiError(415, message, "unsupported_media_type");
  }

  static tooMany(message = "Too many requests. Please slow down.") {
    return new ApiError(429, message, "rate_limited");
  }

  static internal(message = "Something went wrong") {
    return new ApiError(500, message, "internal_error");
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
