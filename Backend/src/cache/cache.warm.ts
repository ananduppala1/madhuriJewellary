import { logger } from "../config/logger.ts";
import * as catalogue from "../services/catalogue.service.ts";
import * as publicService from "../services/public.service.ts";

/**
 * Deliberately minimal.
 *
 * Loading the whole catalogue into Redis at boot would hammer Supabase every
 * time an instance restarts or scales out, for entries most of which nobody
 * asks for. Cache-aside handles the catalogue perfectly well: the first
 * visitor takes one database read and everybody after them is served from
 * Redis.
 *
 * These two are the exception. Site settings are requested by every single page
 * load and the collection list backs the header and the home grid, so warming
 * them costs two queries once and spares the first visitor of each deploy.
 * Off unless CACHE_WARM_ON_STARTUP is set.
 */
export async function warmCache(): Promise<void> {
  const results = await Promise.allSettled([
    publicService.getSiteSettings(),
    catalogue.listCollections(),
  ]);

  const failed = results.filter((result) => result.status === "rejected").length;

  if (failed > 0) {
    // Warming is opportunistic — a failure here must never stop the server.
    logger.warn("cache warm incomplete", { failed });
    return;
  }

  logger.info("cache warmed", { entries: results.length });
}
