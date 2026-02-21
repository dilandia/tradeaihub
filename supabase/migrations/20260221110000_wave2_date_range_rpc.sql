-- W2-02: Date-range filtering at database level
-- Migration: get_trades_by_date_range RPC
--
-- Purpose: Replace the current pattern in AI routes that loads ALL trades
-- then filters in JavaScript. This RPC pushes the date filtering to PostgreSQL,
-- returning only the trades within the requested date range.
--
-- Index coverage: idx_trades_active_user_date (user_id, trade_date DESC)
-- WHERE deleted_at IS NULL -- covers this query exactly.
--
-- Security: SECURITY DEFINER with internal user_id enforcement.
-- The function enforces user_id = p_user_id and deleted_at IS NULL internally.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.get_trades_by_date_range(UUID, DATE, DATE, UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_trades_by_date_range(
  p_user_id     UUID,
  p_start_date  DATE,
  p_end_date    DATE,
  p_import_id   UUID DEFAULT NULL,
  p_account_id  UUID DEFAULT NULL
)
RETURNS SETOF public.trades
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT *
  FROM trades t
  WHERE t.user_id = p_user_id
    AND t.deleted_at IS NULL
    AND t.trade_date >= p_start_date
    AND t.trade_date <= p_end_date
    AND (p_import_id IS NULL OR t.import_id = p_import_id)
    AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
  ORDER BY t.trade_date DESC;
$$;

COMMENT ON FUNCTION public.get_trades_by_date_range(UUID, DATE, DATE, UUID, UUID) IS
  'W2-02: Returns trades filtered by date range at the database level. '
  'Replaces getTrades() + filterByDateRange() pattern in AI routes. '
  'Uses idx_trades_active_user_date for efficient range scans.';

GRANT EXECUTE ON FUNCTION public.get_trades_by_date_range(UUID, DATE, DATE, UUID, UUID)
  TO authenticated;
