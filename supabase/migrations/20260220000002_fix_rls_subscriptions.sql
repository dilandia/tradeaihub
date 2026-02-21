-- [TDR-03] Fix RLS vulnerability: Users could UPDATE/INSERT own subscription
-- This allowed any authenticated user to set their plan to 'elite' for free
-- via browser DevTools or any Supabase client call.
--
-- After this migration:
--   SELECT: Users can read own subscription (unchanged)
--   INSERT/UPDATE/DELETE: Only service_role (Stripe webhook + server admin code)

-- Drop the dangerous UPDATE policy
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Drop the dangerous INSERT policy
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- Remaining policy: "Users can read own subscription" (SELECT only)
-- All INSERT/UPDATE/DELETE operations on subscriptions are now restricted to
-- service_role key, used by:
--   - /api/stripe/webhook (Stripe events)
--   - /api/stripe/checkout (saving stripe_customer_id via admin client)
--   - /api/stripe/checkout-credits (saving stripe_customer_id via admin client)
--   - handle_new_user_subscription() trigger (SECURITY DEFINER, runs as owner)
