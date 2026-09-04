import type { Request, Response } from "express";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../constants/index.ts";
import * as authService from "../services/auth.service.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { message, ok } from "../utils/response.ts";

/**
 * No response from this controller ever contains a token. The browser receives
 * cookies it cannot read and a profile object it can display.
 */

function cookie(req: Request, name: string): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[name];
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const { admin, session } = await authService.login(email, password);
  authService.setSessionCookies(res, session);

  return ok(res, { admin });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.admin) throw ApiError.unauthorized();
  return ok(res, { admin: req.admin });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = cookie(req, REFRESH_COOKIE);
  if (!token) throw ApiError.unauthorized("Please sign in to continue");

  const { admin, session } = await authService.refresh(token);
  authService.setSessionCookies(res, session);

  return ok(res, { admin });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.revoke(cookie(req, ACCESS_COOKIE));
  authService.clearSessionCookies(res);
  return message(res, "Signed out");
});
