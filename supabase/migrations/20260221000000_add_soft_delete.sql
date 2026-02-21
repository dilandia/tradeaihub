-- Migration: TDR-12 — Soft-Delete Mechanism
-- Adds deleted_at column to trades, import_summaries, trading_accounts
-- Updates RLS SELECT policies to exclude soft-deleted records by default
-- Adds partial indexes for efficient restore/audit queries
--
-- Rollback: See companion rollback script or run:
--   ALTER TABLE trades DROP COLUMN IF EXISTS deleted_at;
--   ALTER TABLE import_summaries DROP COLUMN IF EXISTS deleted_at;
--   ALTER TABLE trading_accounts DROP COLUMN IF EXISTS deleted_at;
--   (Then re-create original RLS SELECT policies without deleted_at filter)

BEGIN;

-- ============================================================
-- 1. Add deleted_at column to target tables
-- ============================================================

ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.import_summaries
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ============================================================
-- 2. Indexes for soft-delete queries
-- ============================================================

-- Partial index: only index rows that ARE deleted (sparse)
-- Used for restore/audit queries. Active records (deleted_at IS NULL) are the
-- common case and benefit from existing indexes without extra overhead.
CREATE INDEX IF NOT EXISTS idx_trades_deleted_at
  ON public.trades (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_summaries_deleted_at
  ON public.import_summaries (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trading_accounts_deleted_at
  ON public.trading_accounts (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Composite index for the most common query pattern:
-- "give me active trades for this user ordered by date"
CREATE INDEX IF NOT EXISTS idx_trades_user_active
  ON public.trades (user_id, trade_date DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 3. Update RLS SELECT policies to exclude soft-deleted records
-- ============================================================

-- trades: drop and recreate SELECT policy
DROP POLICY IF EXISTS "Users can read own trades" ON public.trades;
CREATE POLICY "Users can read own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- import_summaries: ensure RLS is enabled, then add/update SELECT policy
ALTER TABLE public.import_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own import summaries" ON public.import_summaries;
CREATE POLICY "Users can read own import summaries"
  ON public.import_summaries FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- trading_accounts: ensure RLS is enabled, then add/update SELECT policy
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own trading accounts" ON public.trading_accounts;
CREATE POLICY "Users can read own trading accounts"
  ON public.trading_accounts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- ============================================================
-- 4. Add COMMENT ON for documentation
-- ============================================================

COMMENT ON COLUMN public.trades.deleted_at IS
  'Soft-delete timestamp. NULL = active, non-NULL = logically deleted. RLS excludes deleted rows from normal SELECT.';

COMMENT ON COLUMN public.import_summaries.deleted_at IS
  'Soft-delete timestamp. NULL = active, non-NULL = logically deleted.';

COMMENT ON COLUMN public.trading_accounts.deleted_at IS
  'Soft-delete timestamp. NULL = active, non-NULL = logically deleted.';

COMMIT;
