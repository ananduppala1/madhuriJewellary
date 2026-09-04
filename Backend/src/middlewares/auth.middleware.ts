import type { Request, RequestHandler } from "express";
import { ACCESS_COOKIE } from "../constants/index.js";
import { resolveAdminFromToken } from "../services/auth.service.js";
import type { AdminRole } from "../types/database.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * The cookie is the supported transport. A bearer header is accepted as well so
 * the API can be exercised from curl or a REST client during setup — it carries
 * exactly the same Supabase access token and is verified identically.
 */
function readAccessToken(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  const fromCookie = cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim() || undefined;

  return undefined;
}

/** Rejects the request unless a valid Supabase session maps to an active admin. */
export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = readAccessToken(req);
  if (!token) throw ApiError.unauthorized("Please sign in to continue");

  req.admin = await resolveAdminFromToken(token);
  next();
});

/** Coarse role gate. One role exists today; the check is here so more can be added. */
export function requireRole(...roles: AdminRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.admin) return next(ApiError.unauthorized("Please sign in to continue"));
    if (roles.length > 0 && !roles.includes(req.admin.role)) {
      return next(ApiError.forbidden("Your role cannot perform that action"));
    }
    next();
  };
}

export const requireAdmin: RequestHandler[] = [authenticate, requireRole("admin", "editor")];
