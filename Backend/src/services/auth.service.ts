import type { CookieOptions, Response } from "express";
import { env, isProduction } from "../config/env.ts";
import { logger } from "../config/logger.ts";
import { adminDb, authClient } from "../config/supabase.ts";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../constants/index.ts";
import type { AuthenticatedAdmin } from "../types/api.ts";
import { ApiError } from "../utils/ApiError.ts";

/**
 * Supabase Auth issues the tokens; this service keeps them in HTTP-only
 * cookies so the admin SPA never holds a credential it could log, leak through
 * an XSS payload, or persist in localStorage.
 */

type Session = { access_token: string; refresh_token: string; expires_in?: number };

const ACCESS_MAX_AGE_MS = 60 * 60 * 1000; // Supabase access tokens last an hour.
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function cookieOptions(maxAge: number): CookieOptions {
  const sameSite = env.COOKIE_SAME_SITE;
  return {
    httpOnly: true,
    // SameSite=None is meaningless without Secure, so force it on.
    secure: env.COOKIE_SECURE || isProduction || sameSite === "none",
    sameSite,
    path: "/",
    maxAge,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setSessionCookies(res: Response, session: Session) {
  res.cookie(ACCESS_COOKIE, session.access_token, cookieOptions(ACCESS_MAX_AGE_MS));
  res.cookie(REFRESH_COOKIE, session.refresh_token, cookieOptions(REFRESH_MAX_AGE_MS));
}

export function clearSessionCookies(res: Response) {
  const base = { ...cookieOptions(0) };
  delete base.maxAge;
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

/** Look up the authorisation profile that hangs off an auth.users row. */
export async function loadAdminProfile(userId: string): Promise<AuthenticatedAdmin> {
  const { data, error } = await adminDb
    .from("admin_users")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to load admin profile", { code: error.code });
    throw ApiError.internal("Could not verify your account");
  }

  if (!data || !data.is_active) {
    throw ApiError.forbidden("This account does not have dashboard access");
  }

  return { id: data.id, email: data.email, fullName: data.full_name, role: data.role };
}

export async function login(email: string, password: string) {
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    // Deliberately vague: never confirm whether the address exists.
    logger.warn("Rejected admin sign-in attempt");
    throw ApiError.unauthorized("Email or password is incorrect");
  }

  const admin = await loadAdminProfile(data.user.id);
  return { admin, session: data.session as Session };
}

export async function refresh(refreshToken: string) {
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

  if (error || !data.session || !data.user) {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }

  const admin = await loadAdminProfile(data.user.id);
  return { admin, session: data.session as Session };
}

/** Verify an access token with Supabase and resolve the admin behind it. */
export async function resolveAdminFromToken(accessToken: string): Promise<AuthenticatedAdmin> {
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }

  return loadAdminProfile(data.user.id);
}

export async function revoke(accessToken: string | undefined) {
  if (!accessToken) return;
  try {
    await adminDb.auth.admin.signOut(accessToken);
  } catch {
    // A token that is already expired cannot be revoked, which is harmless.
  }
}
