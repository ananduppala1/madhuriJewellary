/** URL-safe slug matching the `^[a-z0-9]+(-[a-z0-9]+)*$` constraint in SQL. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Turn a slug into the public route the existing frontend already uses. */
export function pathFromSlug(slug: string): string {
  return `/${slug.replace(/^\/+/, "")}`;
}

/** Filenames arriving from an upload are never trusted as-is. */
export function safeFileStem(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "image";
  const stem = base.replace(/\.[^.]+$/, "");
  return slugify(stem) || "image";
}
