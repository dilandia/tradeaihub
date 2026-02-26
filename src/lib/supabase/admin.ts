/**
 * Cliente Supabase com service_role para operações server-side
 * que precisam bypassar RLS (ex: cache, jobs, sync).
 * NUNCA expor no frontend.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }
  adminClient = createClient(url, key);
  return adminClient;
}

/**
 * Returns the standard callback URL.
 * When Supabase sends the confirmation email, it includes the correct link.
 * We'll use Resend to send a reminder email with the callback URL.
 */
export function getEmailConfirmationCallbackUrl(): string {
  return `${
    process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  }/auth/callback`;
}
