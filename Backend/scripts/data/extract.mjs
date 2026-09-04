/**
 * Build-time helper (run once by the maintainer, not part of `npm run seed`).
 *
 * Converts the public frontend's mock data modules into standalone TypeScript
 * seed modules with no `@/assets` imports, so the backend can seed the exact
 * records the approved site already ships without re-typing them by hand.
 *
 *   node scripts/data/extract.mjs ../frontend
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const frontendRoot = resolve(process.argv[2] ?? "../frontend");
const outDir = resolve("./scripts/data");

const banner = `/**
 * GENERATED FROM THE APPROVED PUBLIC FRONTEND — do not edit by hand.
 * Source: frontend/src/data/*.ts  ·  regenerate with scripts/data/extract.mjs
 *
 * This is seed input only. Once \`npm run seed\` has run, Supabase is the
 * source of truth and nothing in the running API reads this file.
 */
`;

/* ── collections ──────────────────────────────────────────── */

const collectionsSrc = readFileSync(join(frontendRoot, "src/data/collections.ts"), "utf8");

const collectionsBody = collectionsSrc
  .replace(/^import type \{ ImageKey \} from "\.\/images";\n/m, "")
  .split("export const collectionByPath")[0]
  .replace(/image: ImageKey;/, "image: string;")
  .replace(/banner: ImageKey;/, "banner: string;")
  .trimEnd();

writeFileSync(join(outDir, "collections.data.ts"), `${banner}\n${collectionsBody}\n`);

/* ── gallery ──────────────────────────────────────────────── */

const contentSrc = readFileSync(join(frontendRoot, "src/data/content.ts"), "utf8");

const galleryType = contentSrc
  .split("export type GalleryItem = {")[1]
  .split("};")[0]
  .replace(/image: ImageKey;/, "image: string;");

const galleryItems = contentSrc
  .split("export const galleryItems: GalleryItem[] = [")[1]
  .split("\n];")[0];

const galleryFilters = contentSrc.split("export const galleryFilters = ")[1].split(";\n")[0];

writeFileSync(
  join(outDir, "gallery.data.ts"),
  `${banner}
export type GalleryItem = {${galleryType}};

export const galleryItems: GalleryItem[] = [${galleryItems}
];

export const galleryFilters = ${galleryFilters};
`,
);

/* ── site settings ────────────────────────────────────────── */

const siteSrc = readFileSync(join(frontendRoot, "src/data/site.ts"), "utf8");
const siteBody = siteSrc.split("export const site = {")[1].split("} as const;")[0];

writeFileSync(
  join(outDir, "site.data.ts"),
  `${banner}
export const site = {${siteBody}} as const;
`,
);

console.log("Wrote collections.data.ts, gallery.data.ts, site.data.ts");
