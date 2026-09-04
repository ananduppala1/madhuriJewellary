/**
 * Applies the SQL files in supabase/migrations in filename order.
 *
 *   npm run migrate
 *
 * This uses the Supabase REST endpoint for raw SQL, which needs a helper
 * function to exist. If you have the Supabase CLI, `supabase db push` is the
 * supported path and does the same thing — this script is here so the project
 * can be set up without installing the CLI.
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../src/config/env.js";

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, "../supabase/migrations");

async function run(sql: string, name: string) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${name} failed (${response.status}).\n${body}\n\n` +
        "If this says exec_sql does not exist, either create the helper shown in " +
        "Backend/README.md or paste the migration into the Supabase SQL editor.",
    );
  }
}

async function main() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  console.log(`\nApplying ${files.length} migrations to Supabase\n`);

  for (const file of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    await run(sql, file);
    console.log(`  ✓ ${file}`);
  }

  console.log("\nMigrations applied.\n");
}

main().catch((error: unknown) => {
  console.error("\nMigration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
