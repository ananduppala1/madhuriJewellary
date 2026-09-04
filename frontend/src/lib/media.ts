import { imagery, type ImageKey } from "@/data/images";

/**
 * Two kinds of image, kept deliberately separate.
 *
 * `assetImage` resolves a bundled file — the hero plates, the craftsmanship
 * photograph, the store interior. Those are part of the approved design, not
 * catalogue data, and they are always present.
 *
 * `remoteImage` resolves a Cloudinary URL the shop uploaded through the
 * dashboard, and returns **null** when there is nothing to show.
 *
 * The old helper did something else: when a product had no photograph it
 * quietly substituted a different piece of jewellery from the bundle. That is a
 * correctness problem rather than a cosmetic one — a customer would be looking
 * at one necklace under another necklace's name, and could enquire about the
 * wrong piece. A missing photograph now renders as a missing photograph.
 */

const LOCAL_KEYS = new Set<string>(Object.keys(imagery));

export function isImageKey(value: string): value is ImageKey {
  return LOCAL_KEYS.has(value);
}

export type ImageOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "limit";
};

/**
 * Cloudinary delivery options. `f_auto,q_auto` alone typically halves the bytes
 * on the wire by serving AVIF/WebP at a sensible quality, and `w_` caps the
 * download at the size the layout actually uses.
 */
export function cloudinaryUrl(url: string, options: ImageOptions = {}): string {
  if (!url.includes("/image/upload/")) return url;

  const parts = ["f_auto", "q_auto"];
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  parts.push(`c_${options.crop ?? "limit"}`);

  return url.replace("/image/upload/", `/image/upload/${parts.join(",")}/`);
}

/** A bundled design asset. Always resolves. */
export function assetImage(key: ImageKey): string {
  return imagery[key];
}

/**
 * A backend-managed photograph, or null if the shop has not uploaded one.
 * Never falls back to a different image.
 */
export function remoteImage(
  source: string | null | undefined,
  options: ImageOptions = {},
): string | null {
  if (!source) return null;
  if (/^https?:\/\//.test(source)) return cloudinaryUrl(source, options);
  if (source.startsWith("/") || source.startsWith("data:")) return source;
  return null;
}

/**
 * Page banners accept either a bundled key (the static marketing pages) or a
 * Cloudinary URL (a collection's banner from the dashboard). Returns null when
 * neither is available, and the banner simply renders without a photograph —
 * the gradient and the type carry it, exactly as they already do for
 * collections that have never had a banner uploaded.
 */
export function bannerImage(
  source: string | null | undefined,
  options: ImageOptions = {},
): string | null {
  if (!source) return null;
  if (isImageKey(source)) return assetImage(source);
  return remoteImage(source, options);
}
