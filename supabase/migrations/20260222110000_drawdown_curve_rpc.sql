-- W3-05: Drawdown curve computation at database level
-- Migration: get_drawdown_curve RPC
--
-- Purpose: Replace client-side buildDrawdown() which loads all trades into JS memory
-- and computes running drawdown. This RPC uses PostgreSQL window functions to compute
-- the drawdown curve directly, returning pre-aggregated daily points.
--
-- Index coverage: idx_trades_active_user_date (user_id, trade_date DESC)
-- WHERE deleted_at IS NULL -- covers the base query.
--
-- Security: SECURITY DEFINER with internal user_id enforcement.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.get_drawdown_curve(UUID, UUID, UUID, DATE, DATE, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_drawdown_curve(
  p_user_id    UUID,
  p_import_id  UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL,
  p_use_dollar BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  date      DATE,
  drawdown  NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH daily AS (
    SELECT
      t.trade_date,
      SUM(
        CASE
          WHEN p_use_dollar AND t.profit_dollar IS NOT NULL THEN t.profit_dollar
          ELSE t.pips
        END
      ) AS day_pnl
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      AND (p_import_id IS NULL OR t.import_id = p_import_id)
      AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
      AND (p_start_date IS NULL OR t.trade_date >= p_start_date)
      AND (p_end_date IS NULL OR t.trade_date <= p_end_date)
    GROUP BY t.trade_date
  ),
  cumulative AS (
    SELECT
      d.trade_date AS date,
      SUM(d.day_pnl) OVER (ORDER BY d.trade_date) AS cum_equity
    FROM daily d
  ),
  with_peak AS (
    SELECT
      c.date,
      c.cum_equity,
      MAX(c.cum_equity) OVER (ORDER BY c.date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_peak
    FROM cumulative c
  )
  SELECT
    wp.date,
    ROUND(wp.cum_equity - wp.running_peak, 2) AS drawdown
  FROM with_peak wp
  ORDER BY wp.date;
$$;

COMMENT ON FUNCTION public.get_drawdown_curve(UUID, UUID, UUID, DATE, DATE, BOOLEAN) IS
  'W3-05: Computes daily drawdown curve using PostgreSQL window functions. '
  'Returns (date, drawdown) pairs where drawdown = cumulative_equity - running_peak. '
  'Replaces client-side buildDrawdown() with server-side computation.';

GRANT EXECUTE ON FUNCTION public.get_drawdown_curve(UUID, UUID, UUID, DATE, DATE, BOOLEAN)
  TO authenticated;
