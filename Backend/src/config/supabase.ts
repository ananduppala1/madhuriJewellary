import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { Database } from "../types/database.js";

/**
 * Two clients, deliberately.
 *
 * `publicDb` uses the anon key, so every read it performs is still filtered by
 * Row Level Security. Public endpoints use it, which means the RLS policies are
 * exercised in production rather than merely declared in a migration.
 *
 * `adminDb` uses the service-role key and bypasses RLS. It is reachable only
 * from code behind the authentication middleware, and the key never leaves this
 * process.
 */

const shared = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

export const publicDb: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  shared,
);

export const adminDb: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  shared,
);

/** Anon client used purely to exchange credentials with Supabase Auth. */
export const authClient: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  shared,
);
