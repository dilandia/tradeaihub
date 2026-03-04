-- =============================================================================
-- Migration: 20260304000001_harmonization_phase0_schema.sql
-- Description: Import/Sync Harmonization — Phase 0 Schema
--   Formalizes columns that may already exist in production (added via Supabase
--   dashboard) but lack migration files. Also adds new columns for broker
--   timezone support. All statements use IF NOT EXISTS for idempotency.
-- Tables modified: trades, trading_accounts
-- Author: Dex (dev)
-- Date: 2026-03-04
-- Idempotent: Yes
-- Rollback: DROP COLUMN IF EXISTS for each new column; DROP INDEX IF EXISTS
-- =============================================================================

-- ─── trades table ───────────────────────────────────────────────────────────

-- ticket: Position ID from broker/MT5, used for cross-source deduplication
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS ticket TEXT;

-- source: Trade origin tracking ('manual', 'import', 'sync')
-- Note: CHECK constraint added separately below to handle the case where the
-- column already exists without a constraint.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'import';

-- swap: Swap value extracted from MT5 XLSX column L
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS swap NUMERIC DEFAULT 0;

-- commission: Commission value extracted from MT5 XLSX column K
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

-- broker_time: Original broker timestamp before UTC conversion
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS broker_time TIMESTAMPTZ;

-- ─── CHECK constraint for source (idempotent) ──────────────────────────────
-- Add named constraint so we can safely check existence before creating.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'trades_source_check'
      AND constraint_schema = 'public'
  ) THEN
    ALTER TABLE public.trades
      ADD CONSTRAINT trades_source_check
      CHECK (source IN ('manual', 'import', 'sync'));
  END IF;
END $$;

-- ─── Indexes for harmonization queries ──────────────────────────────────────

-- Source-based queries (e.g., "show me only synced trades")
CREATE INDEX IF NOT EXISTS idx_trades_source
  ON public.trades USING btree (user_id, source)
  WHERE deleted_at IS NULL;

-- Ticket-based deduplication lookups (e.g., "does this MT5 position already exist?")
CREATE INDEX IF NOT EXISTS idx_trades_ticket
  ON public.trades USING btree (user_id, ticket)
  WHERE ticket IS NOT NULL AND deleted_at IS NULL;

-- ─── trading_accounts table ─────────────────────────────────────────────────

-- broker_utc_offset: UTC offset in hours for broker's timezone (e.g., +3 for UTC+3)
ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS broker_utc_offset INTEGER DEFAULT 0;

-- ─── Backfill existing trades ───────────────────────────────────────────────
-- Classifies existing trades by their origin:
--   - trading_account_id present + no import_id → came from MetaAPI sync → 'sync'
--   - import_id present → came from file import → already default 'import'
--   - Neither → manual entry or unknown → leave as 'import' (safe default)
DO $$
BEGIN
  -- Safety: only backfill if both source and trading_account_id columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'source'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'trading_account_id'
  ) THEN
    -- Trades with trading_account_id but no import_id = sync trades
    UPDATE public.trades
    SET source = 'sync'
    WHERE trading_account_id IS NOT NULL
      AND import_id IS NULL
      AND (source IS NULL OR source = 'import');
  END IF;
END $$;
