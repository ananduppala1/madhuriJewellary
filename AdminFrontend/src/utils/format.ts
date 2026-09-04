/** Human dates for tables — "3 Sep 2026", or a relative hint when very recent. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffHours = (Date.now() - date.getTime()) / 36e5;

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Mirrors the backend's slugify so the preview shown in a form is accurate. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Cloudinary thumbnails — never ship a 2000px original into a 64px table cell. */
export function thumb(url: string, size = 96): string {
  if (!url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`);
}

export function preview(url: string, width = 600): string {
  if (!url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
}

/** Client-side guard mirroring the API's upload rules, so obvious mistakes
 *  are caught before a file crosses the network. The server re-checks. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name} is not a JPG, PNG, WebP or AVIF image.`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} is larger than 8 MB.`;
  }
  return null;
}
