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
 * Generates an email confirmation link for a newly created user.
 * Uses Supabase Admin API to create a magic link for email confirmation.
 * This link includes the verification code that's needed to confirm the email.
 */
export async function generateConfirmationLink(email: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const redirectTo =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com";

    // Use generateLink with type 'magiclink' to get a confirmation link
    // The link will include the verification code
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${redirectTo}/auth/callback`,
      },
    });

    if (error) {
      console.error("[Admin] Failed to generate confirmation link:", error);
      return null;
    }

    // Extract the action link from properties
    const props = data?.properties as Record<string, unknown>;
    if (props?.email_action_link) {
      return props.email_action_link as string;
    }
    if (props?.action_link) {
      return props.action_link as string;
    }
    // Fallback: if data has an action_link at root level
    const dataRecord = data as Record<string, unknown>;
    if (dataRecord?.action_link) {
      return dataRecord.action_link as string;
    }

    return null;
  } catch (error) {
    console.error("[Admin] Error generating confirmation link:", error);
    return null;
  }
}
