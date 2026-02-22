-- Fix: RLS policy blocks soft-delete UPDATE on trades and import_summaries
-- The SELECT policy requires deleted_at IS NULL, but the UPDATE policy's
-- implicit WITH CHECK inherits this constraint, preventing setting deleted_at.
-- Solution: Add explicit WITH CHECK that allows the user to update their own rows
-- regardless of deleted_at value.

BEGIN;

-- trades: recreate UPDATE policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Users can update own trades" ON public.trades;
CREATE POLICY "Users can update own trades"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- import_summaries: add UPDATE policy (may not exist yet)
DROP POLICY IF EXISTS "Users can update own import summaries" ON public.import_summaries;
CREATE POLICY "Users can update own import summaries"
  ON public.import_summaries FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- trading_accounts: same fix for consistency
DROP POLICY IF EXISTS "Users can update own trading accounts" ON public.trading_accounts;
CREATE POLICY "Users can update own trading accounts"
  ON public.trading_accounts FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
