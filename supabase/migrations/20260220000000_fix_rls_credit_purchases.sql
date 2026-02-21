-- Migration: [TDR-01] Fix RLS vulnerability in credit_purchases table
-- Date: 2026-02-20
--
-- PROBLEM:
-- The policy "Service role can insert credit_purchases" used `with check (true)`,
-- which allows ANY authenticated user to INSERT arbitrary rows into credit_purchases.
-- This is a P0 security vulnerability that enables credit fraud.
--
-- FIX:
-- Drop the permissive INSERT policy entirely.
-- The Stripe webhook uses SUPABASE_SERVICE_ROLE_KEY which automatically bypasses
-- all RLS policies, so no explicit INSERT policy is needed for service_role operations.
--
-- IMPACT:
-- - Stripe webhook: NO CHANGE (service_role bypasses RLS)
-- - Authenticated users: CANNOT insert into credit_purchases (correct behavior)
-- - Anonymous users: Already blocked by RLS (no change)
-- =============================================================================

-- Drop the vulnerable INSERT policy
DROP POLICY IF EXISTS "Service role can insert credit_purchases" ON public.credit_purchases;

-- Verify: After this migration, credit_purchases has only one policy:
--   "Users can read own credit_purchases" (SELECT, auth.uid() = user_id)
-- All INSERT/UPDATE/DELETE operations require service_role (automatic RLS bypass).
