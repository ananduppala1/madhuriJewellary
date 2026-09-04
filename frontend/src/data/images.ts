import antique from "@/assets/collection-antique.jpg";
import bangles from "@/assets/collection-bangles.jpg";
import lightweight from "@/assets/collection-lightweight.jpg";
import temple from "@/assets/collection-temple.jpg";
import bridal from "@/assets/hero-bridal.jpg";
import store from "@/assets/store-interior.jpg";

/**
 * IMAGE REGISTRY
 * --------------
 * Every image on the site is referenced through a key in `imagery`.
 * To swap in real photography later, drop the file into `src/assets/`,
 * import it here, and point the key at it — no component needs editing.
 */
export const imagery = {
  antique,
  bangles,
  lightweight,
  temple,
  bridal,
  store,
} as const;

export type ImageKey = keyof typeof imagery;

export const IMAGE_KEYS = Object.keys(imagery) as ImageKey[];

export type SiteImage = {
  key: ImageKey;
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** Portrait product shots are 900×1100; the two wide plates are 1600×~1050. */
const DIMENSIONS: Record<ImageKey, { width: number; height: number }> = {
  antique: { width: 900, height: 1100 },
  bangles: { width: 900, height: 1100 },
  lightweight: { width: 900, height: 1100 },
  temple: { width: 900, height: 1100 },
  bridal: { width: 1600, height: 1104 },
  store: { width: 1600, height: 1000 },
};

export function img(key: ImageKey, alt: string): SiteImage {
  return { key, src: imagery[key], alt, ...DIMENSIONS[key] };
}

/** Deterministic pick so server and client renders always agree. */
export function pickImage(seed: string): ImageKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return IMAGE_KEYS[hash % IMAGE_KEYS.length]!;
}
