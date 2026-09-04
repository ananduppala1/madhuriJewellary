import type { Response } from "express";

/** One response envelope across the whole API. */

export type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function okList<T>(res: Response, data: T[], meta: Meta, status = 200) {
  return res.status(status).json({ success: true, data, meta });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function message(res: Response, text: string) {
  return res.status(200).json({ success: true, message: text });
}

export function buildMeta(page: number, limit: number, total: number): Meta {
  return { page, limit, total, totalPages: limit > 0 ? Math.ceil(total / limit) : 0 };
}
