-- Migration: [TDR-02] Fix RLS vulnerability in ai_credits UPDATE and INSERT policies
-- Date: 2026-02-20
-- Depends on: TDR-01 (20260220000000_fix_rls_credit_purchases.sql)
--
-- PROBLEM:
-- The policies "Users can update own ai_credits" and "Users can insert own ai_credits"
-- allow any authenticated user to UPDATE their own credits_remaining to any value (e.g. 9999)
-- and INSERT arbitrary credit rows. This is a P0 security vulnerability enabling credit fraud.
--
-- FIX:
-- Drop both UPDATE and INSERT policies.
-- All credit modifications now go through server-side code using service_role (createAdminClient),
-- which automatically bypasses RLS. Only the SELECT policy remains for users to read their balance.
--
-- APPLICATION CODE CHANGES (applied alongside this migration):
-- - src/lib/plan.ts: consumeAiCredits() and ensureAiCreditsForPeriod() now use createAdminClient()
--   instead of createClient() (server cookie-based auth), ensuring they bypass RLS via service_role.
-- - src/app/api/stripe/webhook/route.ts: Already uses service_role (no change needed).
--
-- IMPACT:
-- - Authenticated users: CAN read own balance (SELECT), CANNOT modify (UPDATE/INSERT blocked)
-- - Server code (service_role): Full access (automatic RLS bypass)
-- - Anonymous users: Already blocked by RLS (no change)
-- =============================================================================

-- Drop the vulnerable UPDATE policy
DROP POLICY IF EXISTS "Users can update own ai_credits" ON public.ai_credits;

-- Drop the INSERT policy (credit row creation is server-side only via service_role)
DROP POLICY IF EXISTS "Users can insert own ai_credits" ON public.ai_credits;

-- Verify: After this migration, ai_credits has only one policy:
--   "Users can read own ai_credits" (SELECT, auth.uid() = user_id)
-- All INSERT/UPDATE/DELETE operations require service_role (automatic RLS bypass).
