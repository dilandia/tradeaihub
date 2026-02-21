/**
 * RPC function para calcular métricas de trades de forma eficiente.
 * Phase 3: Query Consolidation - Agregações na DB ao invés de carregar todos os trades em RAM.
 *
 * Retorna métricas agregadas sem precisar buscar 500+ trades na aplicação.
 */

CREATE OR REPLACE FUNCTION public.get_trade_metrics(
  p_user_id uuid,
  p_import_id uuid DEFAULT NULL,
  p_account_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_trades integer,
  winning_trades integer,
  losing_trades integer,
  net_pips numeric,
  net_dollar numeric,
  gross_profit_pips numeric,
  gross_loss_pips numeric,
  gross_profit_dollar numeric,
  gross_loss_dollar numeric,
  has_dollar_data boolean
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
      profit_dollar
    FROM trades t
    WHERE t.user_id = p_user_id
      AND t.deleted_at IS NULL
      AND (p_import_id IS NULL OR t.import_id = p_import_id)
      AND (p_account_id IS NULL OR t.trading_account_id = p_account_id)
  ),
  stats AS (
    SELECT
      COUNT(*)::integer as total_trades,
      COUNT(CASE WHEN is_win THEN 1 END)::integer as winning_trades,
      COUNT(CASE WHEN NOT is_win THEN 1 END)::integer as losing_trades,
      COALESCE(SUM(pips), 0)::numeric as net_pips,
      COALESCE(SUM(profit_dollar), 0)::numeric as net_dollar,
      COALESCE(SUM(CASE WHEN is_win THEN ABS(pips) ELSE 0 END), 0)::numeric as gross_profit_pips,
      COALESCE(SUM(CASE WHEN NOT is_win THEN ABS(pips) ELSE 0 END), 0)::numeric as gross_loss_pips,
      COALESCE(SUM(CASE WHEN is_win THEN ABS(COALESCE(profit_dollar, pips)) ELSE 0 END), 0)::numeric as gross_profit_dollar,
      COALESCE(SUM(CASE WHEN NOT is_win THEN ABS(COALESCE(profit_dollar, pips)) ELSE 0 END), 0)::numeric as gross_loss_dollar,
      COUNT(CASE WHEN profit_dollar IS NOT NULL THEN 1 END) > 0 as has_dollar_data
    FROM trades_filtered
  )
  SELECT
    stats.total_trades,
    stats.winning_trades,
    stats.losing_trades,
    stats.net_pips,
    stats.net_dollar,
    stats.gross_profit_pips,
    stats.gross_loss_pips,
    stats.gross_profit_dollar,
    stats.gross_loss_dollar,
    stats.has_dollar_data
  FROM stats;
$$;

GRANT EXECUTE ON FUNCTION public.get_trade_metrics(uuid, uuid, uuid) TO authenticated;
