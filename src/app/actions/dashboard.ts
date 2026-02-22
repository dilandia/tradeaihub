"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type EquityCurvePoint = {
  date: string;
  equity: number;
  trades: number;
};

export type DrawdownAnalysis = {
  maxDrawdownValue: number;
  maxDrawdownPct: number;
  currentDrawdownValue: number;
  currentDrawdownPct: number;
  peakEquity: number;
  currentEquity: number;
  maxDrawdownStart: string | null;
  maxDrawdownEnd: string | null;
  recoveryDays: number; // -1 means still in drawdown
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: number; // positive = winning, negative = losing
  totalTradingDays: number;
};

export type DashboardMetrics = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPips: number;
  netDollar: number;
  avgWinPips: number;
  avgLossPips: number;
  avgWinDollar: number;
  avgLossDollar: number;
  profitFactor: number;
  profitFactorDollar: number;
  avgRiskReward: number | null;
  zellaScore: number;
  hasDollarData: boolean;
  bestTradePnl: number;
  worstTradePnl: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
};

/* ─── Empty defaults ─── */

function emptyDrawdownAnalysis(): DrawdownAnalysis {
  return {
    maxDrawdownValue: 0,
    maxDrawdownPct: 0,
    currentDrawdownValue: 0,
    currentDrawdownPct: 0,
    peakEquity: 0,
    currentEquity: 0,
    maxDrawdownStart: null,
    maxDrawdownEnd: null,
    recoveryDays: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    currentStreak: 0,
    totalTradingDays: 0,
  };
}

function emptyDashboardMetrics(): DashboardMetrics {
  return {
    totalTrades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    netPips: 0,
    netDollar: 0,
    avgWinPips: 0,
    avgLossPips: 0,
    avgWinDollar: 0,
    avgLossDollar: 0,
    profitFactor: 0,
    profitFactorDollar: 0,
    avgRiskReward: null,
    zellaScore: 0,
    hasDollarData: false,
    bestTradePnl: 0,
    worstTradePnl: 0,
    firstTradeDate: null,
    lastTradeDate: null,
  };
}

/* ─── Helpers (round) ─── */

const r = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/* ─── Dashboard Metrics (W2-03: enhanced get_trade_metrics) ─── */

/**
 * Fetch dashboard metrics via the enhanced get_trade_metrics RPC.
 * Extends the base Metrics type with best/worst trade, avg RR, and date range.
 * Uses React cache() for per-request dedup.
 */
async function _getDashboardMetrics(
  importId?: string | null,
  accountId?: string | null,
  startDate?: string | null,
  endDate?: string | null
): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyDashboardMetrics();

  const { data, error } = await supabase.rpc("get_trade_metrics", {
    p_user_id: user.id,
    p_import_id: importId ?? null,
    p_account_id: accountId ?? null,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
  });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("[dashboard] getDashboardMetrics:", error.message);
    }
    return emptyDashboardMetrics();
  }

  const m = data[0] as Record<string, unknown>;
  const totalTrades = Number(m.total_trades ?? 0);
  const wins = Number(m.winning_trades ?? 0);
  const losses = Number(m.losing_trades ?? 0);
  const netPips = Number(m.net_pips ?? 0);
  const netDollar = Number(m.net_dollar ?? 0);
  const grossProfitPips = Number(m.gross_profit_pips ?? 0);
  const grossLossPips = Number(m.gross_loss_pips ?? 0);
  const grossProfitDollar = Number(m.gross_profit_dollar ?? 0);
  const grossLossDollar = Number(m.gross_loss_dollar ?? 0);

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWinPips = wins > 0 ? grossProfitPips / wins : 0;
  const avgLossPips = losses > 0 ? grossLossPips / losses : 0;
  const profitFactor =
    grossLossPips > 0
      ? grossProfitPips / grossLossPips
      : grossProfitPips > 0
        ? 99
        : 0;
  const avgWinDollar = wins > 0 ? grossProfitDollar / wins : 0;
  const avgLossDollar = losses > 0 ? grossLossDollar / losses : 0;
  const profitFactorDollar =
    grossLossDollar > 0
      ? grossProfitDollar / grossLossDollar
      : grossProfitDollar > 0
        ? 99
        : 0;
  const zellaScore = Math.round(
    Math.min(
      100,
      Math.max(0, (winRate / 100) * 40 + Math.min(profitFactor, 3) * 20)
    )
  );

  const avgRiskRewardRaw = m.avg_risk_reward != null ? Number(m.avg_risk_reward) : null;

  return {
    totalTrades,
    wins,
    losses,
    winRate: r(winRate),
    netPips: r(netPips),
    netDollar: r(netDollar, 2),
    avgWinPips: r(avgWinPips),
    avgLossPips: r(avgLossPips),
    avgWinDollar: r(avgWinDollar, 2),
    avgLossDollar: r(avgLossDollar, 2),
    profitFactor: r(profitFactor, 2),
    profitFactorDollar: r(profitFactorDollar, 2),
    avgRiskReward: avgRiskRewardRaw != null ? r(avgRiskRewardRaw) : null,
    zellaScore,
    hasDollarData: Boolean(m.has_dollar_data ?? false),
    bestTradePnl: r(Number(m.best_trade_pnl ?? 0), 2),
    worstTradePnl: r(Number(m.worst_trade_pnl ?? 0), 2),
    firstTradeDate: (m.first_trade_date as string) ?? null,
    lastTradeDate: (m.last_trade_date as string) ?? null,
  };
}

export const getDashboardMetrics = cache(_getDashboardMetrics);

/* ─── Equity Curve (W2-03: get_equity_curve RPC) ─── */

/**
 * Fetch equity curve data points from the get_equity_curve RPC.
 * Returns pre-aggregated daily/weekly/monthly equity points.
 * Uses React cache() for per-request dedup.
 */
async function _getEquityCurve(
  resolution: "daily" | "weekly" | "monthly" = "daily",
  importId?: string | null,
  accountId?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  useDollar: boolean = true
): Promise<EquityCurvePoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_equity_curve", {
    p_user_id: user.id,
    p_resolution: resolution,
    p_import_id: importId ?? null,
    p_account_id: accountId ?? null,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
    p_use_dollar: useDollar,
  });

  if (error) {
    console.error("[dashboard] getEquityCurve:", error.message);
    return [];
  }

  return (
    (data ?? []) as Array<{ date: string; equity: number; trades: number }>
  ).map((row) => ({
    date: row.date,
    equity: Number(row.equity),
    trades: row.trades,
  }));
}

export const getEquityCurve = cache(_getEquityCurve);

/* ─── Drawdown Analysis (W2-03: get_drawdown_analysis RPC) ─── */

/**
 * Fetch drawdown analysis from the get_drawdown_analysis RPC.
 * Returns summary stats: max/current drawdown, streaks, recovery info.
 * Uses React cache() for per-request dedup.
 */
async function _getDrawdownAnalysis(
  importId?: string | null,
  accountId?: string | null,
  useDollar: boolean = true
): Promise<DrawdownAnalysis> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyDrawdownAnalysis();

  const { data, error } = await supabase.rpc("get_drawdown_analysis", {
    p_user_id: user.id,
    p_import_id: importId ?? null,
    p_account_id: accountId ?? null,
    p_use_dollar: useDollar,
  });

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("[dashboard] getDrawdownAnalysis:", error.message);
    }
    return emptyDrawdownAnalysis();
  }

  const row = data[0] as Record<string, unknown>;
  return {
    maxDrawdownValue: Number(row.max_drawdown_value ?? 0),
    maxDrawdownPct: Number(row.max_drawdown_pct ?? 0),
    currentDrawdownValue: Number(row.current_drawdown_value ?? 0),
    currentDrawdownPct: Number(row.current_drawdown_pct ?? 0),
    peakEquity: Number(row.peak_equity ?? 0),
    currentEquity: Number(row.current_equity ?? 0),
    maxDrawdownStart: (row.max_drawdown_start as string) ?? null,
    maxDrawdownEnd: (row.max_drawdown_end as string) ?? null,
    recoveryDays: Number(row.recovery_days ?? 0),
    maxConsecutiveWins: Number(row.max_consecutive_wins ?? 0),
    maxConsecutiveLosses: Number(row.max_consecutive_losses ?? 0),
    currentStreak: Number(row.current_streak ?? 0),
    totalTradingDays: Number(row.total_trading_days ?? 0),
  };
}

export const getDrawdownAnalysis = cache(_getDrawdownAnalysis);

/* ─── Cached wrappers (W2-03: cross-request caching) ─── */
/*
 * IMPORTANT: unstable_cache() cannot wrap functions that call cookies() (dynamic).
 * createClient() calls cookies(), so we cannot use unstable_cache here.
 * Instead, we use React cache() (per-request dedup) which is already applied
 * to the exported getDashboardMetrics / getEquityCurve / getDrawdownAnalysis.
 *
 * These aliases maintain backward compatibility for dashboard/page.tsx imports.
 */

export async function getCachedDashboardMetrics(
  _userId: string,
  importId?: string,
  accountId?: string,
  startDate?: string,
  endDate?: string
): Promise<DashboardMetrics> {
  return getDashboardMetrics(
    importId ?? null,
    accountId ?? null,
    startDate ?? null,
    endDate ?? null
  );
}

export async function getCachedEquityCurve(
  _userId: string,
  resolution: string = "daily",
  importId?: string,
  accountId?: string,
  startDate?: string,
  endDate?: string,
  useDollar: boolean = true
): Promise<EquityCurvePoint[]> {
  return getEquityCurve(
    resolution as "daily" | "weekly" | "monthly",
    importId ?? null,
    accountId ?? null,
    startDate ?? null,
    endDate ?? null,
    useDollar
  );
}

export async function getCachedDrawdownAnalysis(
  _userId: string,
  importId?: string,
  accountId?: string,
  useDollar: boolean = true
): Promise<DrawdownAnalysis> {
  return getDrawdownAnalysis(
    importId ?? null,
    accountId ?? null,
    useDollar
  );
}
