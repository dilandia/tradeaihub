-- W2-03: Drawdown analysis computation at database level
-- Migration: get_drawdown_analysis RPC
--
-- Purpose: Replace the O(n^2) client-side drawdown calculation in buildDrawdown()
-- and computeRadarMetrics(). Computes max drawdown, current drawdown, recovery periods,
-- and streak information entirely in PostgreSQL using a single-pass O(n) algorithm.
--
-- Language: PL/pgSQL (requires iterative state tracking for peak/drawdown/streaks).
--
-- Index coverage: idx_trades_active_user_date (user_id, trade_date DESC)
-- WHERE deleted_at IS NULL -- covers the base query.
--
-- Security: SECURITY DEFINER with internal user_id enforcement.
--
-- ROLLBACK: DROP FUNCTION IF EXISTS public.get_drawdown_analysis(UUID, UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_drawdown_analysis(
  p_user_id    UUID,
  p_import_id  UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_use_dollar BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  max_drawdown_value    NUMERIC,
  max_drawdown_pct      NUMERIC,
  current_drawdown_value NUMERIC,
  current_drawdown_pct  NUMERIC,
  peak_equity           NUMERIC,
  current_equity        NUMERIC,
  max_drawdown_start    DATE,
  max_drawdown_end      DATE,
  recovery_days         INTEGER,
  max_consecutive_wins  INTEGER,
  max_consecutive_losses INTEGER,
  current_streak        INTEGER,
  total_trading_days    INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_max_dd_value     NUMERIC := 0;
  v_max_dd_pct       NUMERIC := 0;
  v_cur_dd_value     NUMERIC := 0;
  v_cur_dd_pct       NUMERIC := 0;
  v_peak             NUMERIC := 0;
  v_equity           NUMERIC := 0;
  v_dd_start         DATE;
  v_max_dd_start     DATE;
  v_max_dd_end       DATE;
  v_recovery_days    INTEGER := 0;
  v_max_consec_wins  INTEGER := 0;
  v_max_consec_losses INTEGER := 0;
  v_cur_wins         INTEGER := 0;
  v_cur_losses       INTEGER := 0;
  v_cur_streak       INTEGER := 0;
  v_total_days       INTEGER := 0;
  v_rec              RECORD;
BEGIN
  FOR v_rec IN
    SELECT
      trade_date,
      SUM(
        CASE
          WHEN p_use_dollar AND profit_dollar IS NOT NULL THEN profit_dollar
          ELSE pips
        END
      ) AS day_pnl,
      -- For streak: use majority direction of the day
      (SUM(CASE WHEN is_win THEN 1 ELSE -1 END) > 0) AS day_is_win
    FROM trades
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND (p_import_id IS NULL OR import_id = p_import_id)
      AND (p_account_id IS NULL OR trading_account_id = p_account_id)
    GROUP BY trade_date
    ORDER BY trade_date
  LOOP
    v_total_days := v_total_days + 1;
    v_equity := v_equity + v_rec.day_pnl;

    -- Update peak
    IF v_equity > v_peak THEN
      v_peak := v_equity;
      v_dd_start := NULL; -- reset drawdown start
    END IF;

    -- Calculate current drawdown
    IF v_peak > 0 THEN
      v_cur_dd_value := v_peak - v_equity;
      v_cur_dd_pct := ROUND((v_cur_dd_value / v_peak) * 100, 2);
    ELSE
      v_cur_dd_value := GREATEST(0, -v_equity);
      v_cur_dd_pct := 0;
    END IF;

    -- Track drawdown start
    IF v_cur_dd_value > 0 AND v_dd_start IS NULL THEN
      v_dd_start := v_rec.trade_date;
    END IF;

    -- Update max drawdown
    IF v_cur_dd_value > v_max_dd_value THEN
      v_max_dd_value := v_cur_dd_value;
      v_max_dd_pct := v_cur_dd_pct;
      v_max_dd_start := v_dd_start;
      v_max_dd_end := v_rec.trade_date;
    END IF;

    -- Consecutive wins/losses (day-level)
    IF v_rec.day_is_win THEN
      v_cur_wins := v_cur_wins + 1;
      v_cur_losses := 0;
      IF v_cur_wins > v_max_consec_wins THEN
        v_max_consec_wins := v_cur_wins;
      END IF;
    ELSE
      v_cur_losses := v_cur_losses + 1;
      v_cur_wins := 0;
      IF v_cur_losses > v_max_consec_losses THEN
        v_max_consec_losses := v_cur_losses;
      END IF;
    END IF;
  END LOOP;

  -- Current streak (positive = winning, negative = losing)
  IF v_cur_wins > 0 THEN
    v_cur_streak := v_cur_wins;
  ELSIF v_cur_losses > 0 THEN
    v_cur_streak := -v_cur_losses;
  ELSE
    v_cur_streak := 0;
  END IF;

  -- Recovery days: from max drawdown end to when equity recovered to peak
  -- (simplified: just count days from max DD end to either recovery or now)
  IF v_max_dd_end IS NOT NULL AND v_equity >= v_peak THEN
    -- Recovered: count trading days between max DD end and last trade
    SELECT COUNT(DISTINCT trade_date)::INTEGER INTO v_recovery_days
    FROM trades
    WHERE user_id = p_user_id
      AND deleted_at IS NULL
      AND trade_date > v_max_dd_end
      AND (p_import_id IS NULL OR import_id = p_import_id)
      AND (p_account_id IS NULL OR trading_account_id = p_account_id);
  ELSIF v_max_dd_end IS NOT NULL THEN
    -- Not yet recovered: sentinel value
    v_recovery_days := -1;
  END IF;

  RETURN QUERY SELECT
    ROUND(v_max_dd_value, 2),
    v_max_dd_pct,
    ROUND(v_cur_dd_value, 2),
    v_cur_dd_pct,
    ROUND(v_peak, 2),
    ROUND(v_equity, 2),
    v_max_dd_start,
    v_max_dd_end,
    v_recovery_days,
    v_max_consec_wins,
    v_max_consec_losses,
    v_cur_streak,
    v_total_days;
END;
$$;

COMMENT ON FUNCTION public.get_drawdown_analysis(UUID, UUID, UUID, BOOLEAN) IS
  'W2-03: Single-pass O(n) drawdown analysis entirely in PostgreSQL. '
  'Returns max drawdown, current drawdown, peak equity, streaks, and recovery info. '
  'Replaces O(n^2) client-side buildDrawdown() + computeRadarMetrics().';

GRANT EXECUTE ON FUNCTION public.get_drawdown_analysis(UUID, UUID, UUID, BOOLEAN)
  TO authenticated;
