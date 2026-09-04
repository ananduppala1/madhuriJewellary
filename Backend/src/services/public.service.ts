import { cacheKeys, getOrSet } from "../cache/index.ts";
import * as galleryRepo from "../repositories/gallery.repository.ts";
import * as settingsRepo from "../repositories/siteSettings.repository.ts";
import type { PublicGalleryItem, PublicSiteSettings } from "../types/api.ts";
import type { BusinessHour, GalleryCategory } from "../types/database.ts";
import { ApiError } from "../utils/ApiError.ts";

export async function listGallery(category?: GalleryCategory): Promise<PublicGalleryItem[]> {
  return getOrSet<PublicGalleryItem[]>(
    cacheKeys.galleryKey(category),
    async () => {
      const rows = await galleryRepo.listPublic(category);

      return rows.map((row) => ({
        id: row.id,
        caption: row.caption,
        category: row.category,
        span: row.span,
        url: row.secure_url,
        width: row.width,
        height: row.height,
      }));
    },
    "public gallery",
  );
}

/**
 * Shaped to match what the approved frontend already destructures, so wiring it
 * up did not require rewriting the header, footer or contact page.
 *
 * This is the single most-requested endpoint on the site — every page load asks
 * for it — and the least volatile, which makes it the clearest win from the
 * cache. A dashboard edit bumps the `siteSettings` family, so a new WhatsApp
 * number is live on the next request rather than at the end of the TTL.
 */
export async function getSiteSettings(): Promise<PublicSiteSettings> {
  return getOrSet<PublicSiteSettings>(
    cacheKeys.siteSettingsKey(),
    async () => {
      const row = await settingsRepo.getPublic();
      if (!row) throw ApiError.notFound("Site settings have not been configured yet");

      return {
        name: row.business_name,
        legalName: row.legal_name,
        tagline: row.tagline,
        shortDescription: row.short_description,
        url: row.website_url,
        founded: row.founded_year,
        phones: row.phones ?? [],
        whatsapp: row.whatsapp_number,
        email: row.email,
        instagram: row.instagram_url,
        facebook: row.facebook_url,
        youtube: row.youtube_url,
        address: {
          street: row.street,
          locality: row.locality,
          city: row.city,
          region: row.region,
          postalCode: row.postal_code,
          country: row.country,
        },
        geo: { lat: row.latitude, lng: row.longitude },
        mapsQuery: row.maps_query,
        hours: (row.hours ?? []) as BusinessHour[],
        hoursShort: row.hours_short,
        rating: row.rating === null ? null : Number(row.rating),
        ratingCount: row.rating_count,
      };
    },
    "public site settings",
  );
}
