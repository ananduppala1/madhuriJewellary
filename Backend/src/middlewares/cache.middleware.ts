import type { RequestHandler } from "express";
import { PUBLIC_CACHE_CONTROL } from "../constants/index.ts";

/**
 * Public reads are safe to cache briefly at the edge. Admin edits show up
 * within the window without any rebuild, and the origin stops being hit on
 * every page view.
 */
export const publicCache: RequestHandler = (req, res, next) => {
  if (req.method === "GET") res.setHeader("Cache-Control", PUBLIC_CACHE_CONTROL);
  next();
};

/** Anything behind authentication must never be stored by a shared cache. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  next();
};
