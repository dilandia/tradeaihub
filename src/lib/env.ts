import { z } from "zod";

/**
 * Server-side environment variable validation.
 * Import this in server entry points to catch missing env vars at startup.
 *
 * NEXT_PUBLIC_* vars are available on both client and server.
 * All others are server-only.
 */

const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().min(1).optional(),
  STRIPE_ELITE_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_ELITE_ANNUAL_PRICE_ID: z.string().min(1).optional(),
  STRIPE_CREDITS_20_PRICE_ID: z.string().min(1).optional(),
  STRIPE_CREDITS_50_PRICE_ID: z.string().min(1).optional(),
  STRIPE_CREDITS_100_PRICE_ID: z.string().min(1).optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().startsWith("sk-"),

  // Resend (email)
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().optional(),

  // MetaAPI
  METAAPI_TOKEN: z.string().min(1).optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Analytics (optional — graceful degradation)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _validated = false;

/**
 * Validate server environment variables.
 * Call once at app startup. Throws with clear error messages on failure.
 */
export function validateEnv(): ServerEnv {
  if (_validated) return serverSchema.parse(process.env);

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`[env] Missing or invalid environment variables:\n${missing}`);
    throw new Error(`Environment validation failed:\n${missing}`);
  }

  _validated = true;
  return result.data;
}
