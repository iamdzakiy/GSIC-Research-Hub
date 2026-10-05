import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Service-role client. Server only — never import from a client component. */
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

export function siteUrl(req?: Request): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || (req ? new URL(req.url).origin : "http://localhost:3000")).replace(/\/$/, "");
}
