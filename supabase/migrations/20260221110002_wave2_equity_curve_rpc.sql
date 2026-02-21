-- W2-03: Equity curve computation at database level
-- Migration: get_equity_curve RPC
--
-- Purpose: Replace buildCumulativePnl(trades) which loads all trades into JS memory
-- and computes running sums. This RPC uses PostgreSQL window functions to compute
-- the equity curve directly, returning pre-aggregated daily/weekly/monthly points.
--
-- Index coverage: idx_trades_active_user_date (user_id, trade_date DESC)
-- WHERE deleted_at IS NULL -- covers the base query.
--
-- Security: SECURITY DEFINER with internal user_id enforcement.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.get_equity_curve(UUID, VARCHAR, UUID, UUID, DATE, DATE, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_equity_curve(
  p_user_id    UUID,
  p_resolution VARCHAR DEFAULT 'daily',
  p_import_id  UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL,
  p_use_dollar BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  date    DATE,
  equity  NUMERIC,
  trades  INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH filtered AS (
    SELECT
      trade_date,
      CASE
        WHEN p_use_dollar AND profit_dollar IS NOT NULL THEN profit_dollar
        ELSE pips
      END AS pnl_value
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      AND (p_import_id IS NULL OR t.import_id = p_import_id)
      AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
      AND (p_start_date IS NULL OR t.trade_date >= p_start_date)
      AND (p_end_date IS NULL OR t.trade_date <= p_end_date)
  ),
  bucketed AS (
    SELECT
      CASE
        WHEN p_resolution = 'weekly'
          THEN DATE_TRUNC('week', trade_date)::DATE
        WHEN p_resolution = 'monthly'
          THEN DATE_TRUNC('month', trade_date)::DATE
        ELSE trade_date
      END AS bucket_date,
      pnl_value
    FROM filtered
  ),
  aggregated AS (
    SELECT
      bucket_date,
      SUM(pnl_value) AS period_pnl,
      COUNT(*)::INTEGER AS period_trades
    FROM bucketed
    GROUP BY bucket_date
  )
  SELECT
    a.bucket_date AS date,
    ROUND(SUM(a.period_pnl) OVER (ORDER BY a.bucket_date), 2) AS equity,
    a.period_trades AS trades
  FROM aggregated a
  ORDER BY a.bucket_date;
$$;

COMMENT ON FUNCTION public.get_equity_curve(UUID, VARCHAR, UUID, UUID, DATE, DATE, BOOLEAN) IS
  'W2-03: Computes equity curve using PostgreSQL window functions (SUM OVER). '
  'Supports daily/weekly/monthly resolution and dollar/pips toggle. '
  'Replaces client-side buildCumulativePnl() with server-side computation.';

GRANT EXECUTE ON FUNCTION public.get_equity_curve(UUID, VARCHAR, UUID, UUID, DATE, DATE, BOOLEAN)
  TO authenticated;
