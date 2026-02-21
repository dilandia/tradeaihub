-- W2-03: Enhanced get_trade_metrics with date-range filtering and additional output columns
-- Migration: get_trade_metrics v2 (extends existing 3-param version to 5-param)
--
-- Purpose: Extend the existing get_trade_metrics RPC with optional date range
-- parameters (p_start_date, p_end_date) and additional output columns
-- (best_trade_pnl, worst_trade_pnl, avg_risk_reward, first_trade_date, last_trade_date).
--
-- Backward compatible: existing callers that pass NULL dates get the same behavior.
--
-- IMPORTANT: PostgreSQL treats different parameter lists as different function overloads.
-- We must DROP the old 3-param signature before creating the new 5-param version
-- to avoid having two separate overloaded functions.
--
-- ROLLBACK:
--   DROP FUNCTION IF EXISTS public.get_trade_metrics(UUID, UUID, UUID, DATE, DATE);
--   -- Then re-apply 20260221000002_trade_metrics_rpc.sql to restore the original

BEGIN;

-- Step 1: Drop the old 3-param signature to avoid overload ambiguity
DROP FUNCTION IF EXISTS public.get_trade_metrics(uuid, uuid, uuid);

-- Step 2: Create the enhanced 5-param version
CREATE OR REPLACE FUNCTION public.get_trade_metrics(
  p_user_id    UUID,
  p_import_id  UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL
)
RETURNS TABLE (
  total_trades         INTEGER,
  winning_trades       INTEGER,
  losing_trades        INTEGER,
  net_pips             NUMERIC,
  net_dollar           NUMERIC,
  gross_profit_pips    NUMERIC,
  gross_loss_pips      NUMERIC,
  gross_profit_dollar  NUMERIC,
  gross_loss_dollar    NUMERIC,
  has_dollar_data      BOOLEAN,
  best_trade_pnl       NUMERIC,
  worst_trade_pnl      NUMERIC,
  avg_risk_reward      NUMERIC,
  first_trade_date     DATE,
  last_trade_date      DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH trades_filtered AS (
    SELECT
      is_win,
      pips,
      profit_dollar,
      risk_reward,
      trade_date
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      AND (p_import_id IS NULL OR t.import_id = p_import_id)
      AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
      AND (p_start_date IS NULL OR t.trade_date >= p_start_date)
      AND (p_end_date IS NULL OR t.trade_date <= p_end_date)
  )
  SELECT
    COUNT(*)::INTEGER                                               AS total_trades,
    COUNT(CASE WHEN is_win THEN 1 END)::INTEGER                    AS winning_trades,
    COUNT(CASE WHEN NOT is_win THEN 1 END)::INTEGER                AS losing_trades,
    COALESCE(SUM(pips), 0)::NUMERIC                                AS net_pips,
    COALESCE(SUM(profit_dollar), 0)::NUMERIC                       AS net_dollar,
    COALESCE(SUM(CASE WHEN is_win THEN ABS(pips) ELSE 0 END), 0)::NUMERIC
                                                                    AS gross_profit_pips,
    COALESCE(SUM(CASE WHEN NOT is_win THEN ABS(pips) ELSE 0 END), 0)::NUMERIC
                                                                    AS gross_loss_pips,
    COALESCE(SUM(CASE WHEN is_win THEN ABS(COALESCE(profit_dollar, pips)) ELSE 0 END), 0)::NUMERIC
                                                                    AS gross_profit_dollar,
    COALESCE(SUM(CASE WHEN NOT is_win THEN ABS(COALESCE(profit_dollar, pips)) ELSE 0 END), 0)::NUMERIC
                                                                    AS gross_loss_dollar,
    (COUNT(CASE WHEN profit_dollar IS NOT NULL THEN 1 END) > 0)    AS has_dollar_data,
    COALESCE(MAX(COALESCE(profit_dollar, pips)), 0)::NUMERIC       AS best_trade_pnl,
    COALESCE(MIN(COALESCE(profit_dollar, pips)), 0)::NUMERIC       AS worst_trade_pnl,
    CASE
      WHEN COUNT(CASE WHEN risk_reward IS NOT NULL THEN 1 END) > 0
      THEN AVG(risk_reward) FILTER (WHERE risk_reward IS NOT NULL)
      ELSE NULL
    END::NUMERIC                                                    AS avg_risk_reward,
    MIN(trade_date)                                                 AS first_trade_date,
    MAX(trade_date)                                                 AS last_trade_date
  FROM trades_filtered;
$$;

COMMENT ON FUNCTION public.get_trade_metrics(UUID, UUID, UUID, DATE, DATE) IS
  'W2-03: Enhanced trade metrics with optional date-range filtering and additional output columns. '
  'Backward compatible: NULL date params return metrics for all trades (same as v1). '
  'New output: best_trade_pnl, worst_trade_pnl, avg_risk_reward, first_trade_date, last_trade_date.';

-- Step 3: Grant execute with the NEW parameter signature
GRANT EXECUTE ON FUNCTION public.get_trade_metrics(UUID, UUID, UUID, DATE, DATE)
  TO authenticated;

COMMIT;
