-- Migration: Cleanup duplicate indexes on trades table
-- Date: 2026-02-21
-- Author: Dara (Data Engineer Agent)
--
-- CONTEXT:
-- Two migration files (20260221000003_optimize_indexes.sql and
-- 20260221_wave1_phase4_indexing.sql) created overlapping indexes.
-- Three indexes were identical:
--   - idx_trades_active_user_date (KEEPER - canonical)
--   - idx_trades_not_deleted      (DROPPED - exact duplicate)
--   - idx_trades_user_active      (DROPPED - exact duplicate)
-- All three were: btree (user_id, trade_date DESC) WHERE (deleted_at IS NULL)
--
-- IMPACT: Saves ~32KB now, more as trades table grows.
-- ROLLBACK: Re-create with CREATE INDEX IF NOT EXISTS statements below.

-- Drop duplicate indexes (idempotent)
DROP INDEX IF EXISTS idx_trades_not_deleted;
DROP INDEX IF EXISTS idx_trades_user_active;

-- ROLLBACK SCRIPT (if needed):
-- CREATE INDEX IF NOT EXISTS idx_trades_not_deleted
--   ON public.trades (user_id, trade_date DESC)
--   WHERE deleted_at IS NULL;
--
-- CREATE INDEX IF NOT EXISTS idx_trades_user_active
--   ON public.trades (user_id, trade_date DESC)
--   WHERE deleted_at IS NULL;
