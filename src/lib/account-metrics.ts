/**
 * Helper functions to read MetaStats metrics from account_metrics table.
 * Server-side only (uses server Supabase client).
 */
import { createClient } from "@/lib/supabase/server";

export type MetricsSummary = {
  gain: number | null;
  absoluteGain: number | null;
  dailyGain: number | null;
  monthlyGain: number | null;
  profitFactor: number | null;
  expectancy: number | null;
  expectancyPips: number | null;
  sortinoRatio: number | null;
  sharpeRatio: number | null;
  standardDeviationProfit: number | null;
  kurtosisProfit: number | null;
  zScore: number | null;
  cagr: number | null;
  mar: number | null;
  trades: number | null;
  wonTradesPercent: number | null;
  lostTradesPercent: number | null;
  longTrades: number | null;
  shortTrades: number | null;
  longWonTradesPercent: number | null;
  shortWonTradesPercent: number | null;
  bestTrade: number | null;
  bestTradeDate: string | null;
  worstTrade: number | null;
  worstTradeDate: string | null;
  averageWin: number | null;
  averageLoss: number | null;
  lots: number | null;
  averageTradeLengthInMilliseconds: number | null;
  highestBalance: number | null;
  highestBalanceDate: string | null;
  maxDrawdown: number | null;
  riskOfRuin: unknown[] | null;
  currencySummary: unknown[] | null;
  closeTradesByWeekDay: unknown[] | null;
  openTradesByHour: unknown[] | null;
  _fetchedAt: string;
};

export type AccountMetrics = {
  id: string;
  trading_account_id: string;
  user_id: string;
  metrics_summary: MetricsSummary | null;
  trades_count: number | null;
  updated_at: string;
};

/** Get MetaStats metrics for a specific trading account */
export async function getAccountMetrics(
  tradingAccountId: string
): Promise<AccountMetrics | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_metrics")
    .select("id, trading_account_id, user_id, metrics_summary, trades_count, updated_at")
    .eq("trading_account_id", tradingAccountId)
    .single();
  return data as AccountMetrics | null;
}

/** Get MetaStats metrics for all trading accounts of a user */
export async function getUserMetrics(
  userId: string
): Promise<AccountMetrics[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("account_metrics")
    .select("id, trading_account_id, user_id, metrics_summary, trades_count, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as AccountMetrics[];
}

/** Get aggregated metrics across all accounts (picks the one with most trades) */
export async function getPrimaryMetrics(
  userId: string
): Promise<MetricsSummary | null> {
  const metrics = await getUserMetrics(userId);
  if (metrics.length === 0) return null;
  // Return metrics from the account with the most trades
  const best = metrics.reduce((a, b) =>
    (a.trades_count ?? 0) >= (b.trades_count ?? 0) ? a : b
  );
  return best.metrics_summary;
}
