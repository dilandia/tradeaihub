/**
 * Funções de cálculo client-safe para os widgets do dashboard.
 * NÃO importa nada de server (Supabase, cookies, etc).
 *
 * Todas as funções que lidam com valores P&L aceitam `useDollar?: boolean`.
 * Quando true, usam `profit_dollar` do trade (se disponível) em vez de `pips`.
 */
import type { CalendarTrade } from "@/lib/calendar-utils";

/* ─────── Helpers ─────── */

function round(val: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(val * f) / f;
}

/** Retorna o valor P&L correto do trade baseado no modo. */
function tv(t: CalendarTrade, useDollar: boolean): number {
  return useDollar && t.profit_dollar != null ? t.profit_dollar : t.pips;
}

function groupByDate(trades: CalendarTrade[]): Map<string, CalendarTrade[]> {
  const map = new Map<string, CalendarTrade[]>();
  for (const t of trades) {
    const arr = map.get(t.date) ?? [];
    arr.push(t);
    map.set(t.date, arr);
  }
  return map;
}

/* ═══════════════════════════════════════════════
 * 0. Client-side Metrics (recomputa a partir de CalendarTrade[])
 *    Espelha computeMetrics de trades.ts mas funciona no client.
 * ═══════════════════════════════════════════════ */

export type ClientMetrics = {
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
};

const EMPTY_METRICS: ClientMetrics = {
  totalTrades: 0, wins: 0, losses: 0, winRate: 0,
  netPips: 0, netDollar: 0,
  avgWinPips: 0, avgLossPips: 0, avgWinDollar: 0, avgLossDollar: 0,
  profitFactor: 0, profitFactorDollar: 0,
  avgRiskReward: null, zellaScore: 0, hasDollarData: false,
};

export function computeClientMetrics(trades: CalendarTrade[]): ClientMetrics {
  if (trades.length === 0) return EMPTY_METRICS;

  const wins = trades.filter((t) => t.is_win);
  const losses = trades.filter((t) => !t.is_win);
  const totalTrades = trades.length;
  const winRate = round((wins.length / totalTrades) * 100);

  // --- Pips ---
  const netPips = trades.reduce((s, t) => s + t.pips, 0);
  const grossProfitPips = wins.reduce((s, t) => s + Math.abs(t.pips), 0);
  const grossLossPips = losses.reduce((s, t) => s + Math.abs(t.pips), 0);
  const avgWinPips = wins.length > 0 ? grossProfitPips / wins.length : 0;
  const avgLossPips = losses.length > 0 ? grossLossPips / losses.length : 0;
  const profitFactor = grossLossPips > 0 ? grossProfitPips / grossLossPips : grossProfitPips > 0 ? 99 : 0;

  // --- Dollar ---
  const hasDollarData = trades.some((t) => t.profit_dollar != null);
  const dollarVal = (t: CalendarTrade) => t.profit_dollar != null ? t.profit_dollar : t.pips;
  const netDollar = trades.reduce((s, t) => s + dollarVal(t), 0);
  const grossProfitDollar = wins.reduce((s, t) => s + Math.abs(dollarVal(t)), 0);
  const grossLossDollar = losses.reduce((s, t) => s + Math.abs(dollarVal(t)), 0);
  const avgWinDollar = wins.length > 0 ? grossProfitDollar / wins.length : 0;
  const avgLossDollar = losses.length > 0 ? grossLossDollar / losses.length : 0;
  const profitFactorDollar = grossLossDollar > 0 ? grossProfitDollar / grossLossDollar : grossProfitDollar > 0 ? 99 : 0;

  // --- Risk/Reward ---
  const rrTrades = trades.filter((t) => t.risk_reward != null && t.risk_reward > 0);
  const avgRiskReward = rrTrades.length > 0
    ? round(rrTrades.reduce((s, t) => s + t.risk_reward!, 0) / rrTrades.length)
    : null;

  // --- Zella Score ---
  const pf = Math.min(profitFactor, 5);
  const wr = winRate;
  const rr = avgRiskReward ?? 1;
  const zellaScore = Math.min(100, Math.round(wr * 0.35 + pf * 8 + Math.min(rr, 3) * 10));

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate,
    netPips: round(netPips),
    netDollar: round(netDollar, 2),
    avgWinPips: round(avgWinPips),
    avgLossPips: round(avgLossPips),
    avgWinDollar: round(avgWinDollar, 2),
    avgLossDollar: round(avgLossDollar, 2),
    profitFactor: round(profitFactor, 2),
    profitFactorDollar: round(profitFactorDollar, 2),
    avgRiskReward,
    zellaScore,
    hasDollarData,
  };
}

/* ═══════════════════════════════════════════════
 * 0b. Date range filtering helper
 * ═══════════════════════════════════════════════ */

export function filterByDateRange(trades: CalendarTrade[], range: string): CalendarTrade[] {
  if (range === "all") return trades;

  const now = new Date();
  let cutoff: Date;

  if (range === "ytd") {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else {
    const map: Record<string, number> = {
      "7d": 7, "14d": 14, "30d": 30, "90d": 90, "6m": 180, "1y": 365,
    };
    const days = map[range] ?? 30;
    cutoff = new Date(now.getTime() - days * 86400000);
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return trades.filter((t) => t.date >= cutoffStr);
}

/* ═══════════════════════════════════════════════
 * 1. Day Win Rate
 * ═══════════════════════════════════════════════ */

export type DayWinRateResult = {
  winDays: number;
  lossDays: number;
  totalDays: number;
  dayWinPct: number;
};

export function computeDayWinRate(trades: CalendarTrade[], useDollar = false): DayWinRateResult {
  const byDate = groupByDate(trades);
  let winDays = 0;
  let lossDays = 0;
  for (const [, dayTrades] of byDate) {
    const dayPnl = dayTrades.reduce((s, t) => s + tv(t, useDollar), 0);
    if (dayPnl > 0) winDays++;
    else lossDays++;
  }
  const totalDays = winDays + lossDays;
  return {
    winDays,
    lossDays,
    totalDays,
    dayWinPct: totalDays > 0 ? round((winDays / totalDays) * 100) : 0,
  };
}

/* ═══════════════════════════════════════════════
 * 2. Radar / Zella Score Metrics (normalizados 0-100)
 *    Fórmulas baseadas no TradeZella oficial:
 *    https://intercom.help/tradezella-4066d388d93c/en/articles/10305642
 * ═══════════════════════════════════════════════ */

export type RadarMetrics = {
  winRate: number;
  consistency: number;
  profitFactor: number;
  maxDrawdown: number;
  avgWinLoss: number;
  recoveryFactor: number;
};

/** Pesos oficiais do Zella Score */
export const ZELLA_WEIGHTS: Record<keyof RadarMetrics, number> = {
  avgWinLoss: 0.20,
  winRate: 0.15,
  maxDrawdown: 0.20,
  profitFactor: 0.25,
  recoveryFactor: 0.10,
  consistency: 0.10,
};

/** Calcula o Zella Score ponderado (0-100) a partir das métricas individuais */
export function computeZellaScore(m: RadarMetrics): number {
  return round(
    m.avgWinLoss * ZELLA_WEIGHTS.avgWinLoss +
    m.winRate * ZELLA_WEIGHTS.winRate +
    m.maxDrawdown * ZELLA_WEIGHTS.maxDrawdown +
    m.profitFactor * ZELLA_WEIGHTS.profitFactor +
    m.recoveryFactor * ZELLA_WEIGHTS.recoveryFactor +
    m.consistency * ZELLA_WEIGHTS.consistency
  );
}

/* --- Score helpers (fórmulas TradeZella) --- */

function scoreAvgWinLoss(ratio: number): number {
  if (ratio >= 2.6) return 100;
  if (ratio >= 2.4) return 90 + ((ratio - 2.4) / 0.2) * 10;
  if (ratio >= 2.2) return 80 + ((ratio - 2.2) / 0.2) * 10;
  if (ratio >= 2.0) return 70 + ((ratio - 2.0) / 0.2) * 10;
  if (ratio >= 1.9) return 60 + ((ratio - 1.9) / 0.1) * 10;
  if (ratio >= 1.8) return 50 + ((ratio - 1.8) / 0.1) * 10;
  return Math.max(0, 20);
}

function scoreWinPct(pct: number): number {
  const TOP = 60;
  return Math.min(100, (pct / TOP) * 100);
}

function scoreProfitFactor(pf: number): number {
  if (pf >= 2.6) return 100;
  if (pf >= 2.4) return 90 + ((pf - 2.4) / 0.2) * 10;
  if (pf >= 2.2) return 80 + ((pf - 2.2) / 0.2) * 10;
  if (pf >= 2.0) return 70 + ((pf - 2.0) / 0.2) * 10;
  if (pf >= 1.9) return 60 + ((pf - 1.9) / 0.1) * 10;
  if (pf >= 1.8) return 50 + ((pf - 1.8) / 0.1) * 10;
  return Math.max(0, 20);
}

function scoreRecoveryFactor(rf: number): number {
  if (rf >= 3.5) return 100;
  if (rf >= 3.0) return 70 + ((rf - 3.0) / 0.5) * 19;
  if (rf >= 2.5) return 60 + ((rf - 2.5) / 0.5) * 10;
  if (rf >= 2.0) return 50 + ((rf - 2.0) / 0.5) * 10;
  if (rf >= 1.5) return 30 + ((rf - 1.5) / 0.5) * 19;
  if (rf >= 1.0) return 1 + ((rf - 1.0) / 0.5) * 28;
  return 0;
}

export function computeRadarMetrics(trades: CalendarTrade[], useDollar = false): RadarMetrics {
  if (trades.length === 0) {
    return { winRate: 0, consistency: 0, profitFactor: 0, maxDrawdown: 0, avgWinLoss: 0, recoveryFactor: 0 };
  }

  const wins = trades.filter((t) => t.is_win);
  const losses = trades.filter((t) => !t.is_win);

  /* 1. Win % */
  const rawWinPct = (wins.length / trades.length) * 100;
  const winRate = round(scoreWinPct(rawWinPct));

  /* 2. Profit Factor */
  const grossProfit = wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
  const rawPF = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5 : 0;
  const profitFactor = round(scoreProfitFactor(rawPF));

  /* 3. Avg Win/Loss Ratio */
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLossVal = losses.length > 0 ? grossLoss / losses.length : 1;
  const rawRatio = avgLossVal > 0 ? avgWin / avgLossVal : avgWin > 0 ? 3 : 0;
  const avgWinLoss = round(scoreAvgWinLoss(rawRatio));

  /* 4. Max Drawdown */
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of sorted) {
    cum += tv(t, useDollar);
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }
  const ddPct = peak > 0 ? (maxDD / peak) * 100 : 0;
  const maxDrawdown = round(Math.max(0, Math.min(100, 100 - ddPct)));

  /* 5. Recovery Factor */
  const netProfit = cum;
  const rawRF = maxDD > 0 ? netProfit / maxDD : netProfit > 0 ? 5 : 0;
  const recoveryFactor = netProfit >= 0 ? round(scoreRecoveryFactor(rawRF)) : 0;

  /* 6. Consistency Score (std_dev / total profit → 100 - result) */
  const dailyPnl = new Map<string, number>();
  for (const t of sorted) {
    dailyPnl.set(t.date, (dailyPnl.get(t.date) ?? 0) + tv(t, useDollar));
  }
  const profitVals = Array.from(dailyPnl.values());
  const avgDailyProfit = profitVals.length > 0 ? profitVals.reduce((a, b) => a + b, 0) / profitVals.length : 0;
  let consistency = 0;
  if (avgDailyProfit > 0 && profitVals.length > 1) {
    const totalProfit = profitVals.reduce((a, b) => a + b, 0);
    const variance = profitVals.reduce((s, v) => s + (v - avgDailyProfit) ** 2, 0) / profitVals.length;
    const stdDev = Math.sqrt(variance);
    const rawConsistency = totalProfit > 0 ? (stdDev / totalProfit) * 100 : 100;
    consistency = round(Math.max(0, Math.min(100, 100 - rawConsistency)));
  }

  return { winRate, consistency, profitFactor, maxDrawdown, avgWinLoss, recoveryFactor };
}

/** Valores brutos usados para explicar o Takerz Score (antes da normalização) */
export type RadarRawValues = {
  winPct: number;
  profitFactorRaw: number;
  avgWinLossRatio: number;
  maxDrawdownPct: number;
  recoveryFactorRaw: number;
};

/** Retorna métricas normalizadas e valores brutos para o agente de explicação do Takerz Score */
export function computeRadarMetricsWithRaw(
  trades: CalendarTrade[],
  useDollar = false
): { radar: RadarMetrics; raw: RadarRawValues } {
  const radar = computeRadarMetrics(trades, useDollar);
  if (trades.length === 0) {
    return {
      radar,
      raw: {
        winPct: 0,
        profitFactorRaw: 0,
        avgWinLossRatio: 0,
        maxDrawdownPct: 0,
        recoveryFactorRaw: 0,
      },
    };
  }

  const wins = trades.filter((t) => t.is_win);
  const losses = trades.filter((t) => !t.is_win);
  const rawWinPct = (wins.length / trades.length) * 100;
  const grossProfit = wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
  const rawPF = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5 : 0;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLossVal = losses.length > 0 ? grossLoss / losses.length : 1;
  const rawRatio = avgLossVal > 0 ? avgWin / avgLossVal : avgWin > 0 ? 3 : 0;

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  let peak = 0;
  let maxDD = 0;
  for (const t of sorted) {
    cum += tv(t, useDollar);
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }
  const ddPct = peak > 0 ? (maxDD / peak) * 100 : 0;
  const rawRF = maxDD > 0 ? cum / maxDD : cum > 0 ? 5 : 0;

  return {
    radar,
    raw: {
      winPct: round(rawWinPct, 1),
      profitFactorRaw: round(rawPF, 2),
      avgWinLossRatio: round(rawRatio, 2),
      maxDrawdownPct: round(ddPct, 1),
      recoveryFactorRaw: round(rawRF, 2),
    },
  };
}

/* ═══════════════════════════════════════════════
 * 3. Net Daily P&L (bar chart data)
 * ═══════════════════════════════════════════════ */

export type DailyPnlPoint = { date: string; pnl: number };

export type DailyWinLossPoint = { date: string; ratio: number };

/** Razão ganho/perda por dia (para gráfico Avg daily win/loss) */
export function buildAvgDailyWinLossRatio(trades: CalendarTrade[], useDollar = false): DailyWinLossPoint[] {
  const byDate = groupByDate(trades);
  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayTrades]) => {
      const wins = dayTrades.filter((t) => t.is_win);
      const losses = dayTrades.filter((t) => !t.is_win);
      const grossWin = wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
      const grossLoss = losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0);
      const ratio = grossLoss > 0 ? round(grossWin / grossLoss, 2) : grossWin > 0 ? 99 : 0;
      return { date: date.slice(5), ratio };
    });
}

export function buildNetDailyPnl(trades: CalendarTrade[], useDollar = false): DailyPnlPoint[] {
  const byDate = new Map<string, number>();
  for (const t of trades) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + tv(t, useDollar));
  }
  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => ({ date: date.slice(5), pnl: round(pnl, useDollar ? 2 : 1) }));
}

/* ═══════════════════════════════════════════════
 * 4. Account Balance (cumulative line chart)
 * ═══════════════════════════════════════════════ */

export type BalancePoint = { date: string; balance: number };

export function buildAccountBalance(trades: CalendarTrade[], useDollar = false): BalancePoint[] {
  const byDate = new Map<string, number>();
  for (const t of trades) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + tv(t, useDollar));
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cum = 0;
  return sorted.map(([date, pnl]) => {
    cum += pnl;
    return { date: date.slice(5), balance: round(cum, useDollar ? 2 : 1) };
  });
}

/* ═══════════════════════════════════════════════
 * 5. Drawdown (area chart)
 * ═══════════════════════════════════════════════ */

export type DrawdownPoint = { date: string; drawdown: number };

export function buildDrawdown(trades: CalendarTrade[], useDollar = false): DrawdownPoint[] {
  const byDate = new Map<string, number>();
  for (const t of trades) {
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + tv(t, useDollar));
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cum = 0;
  let peak = 0;
  return sorted.map(([date, pnl]) => {
    cum += pnl;
    if (cum > peak) peak = cum;
    return { date: date.slice(5), drawdown: round(cum - peak, useDollar ? 2 : 1) };
  });
}

/** Drawdown baseado em saldo (balance), não só equity. Requer saldo inicial. */
export function computeBalanceDrawdown(
  initialBalance: number,
  trades: CalendarTrade[],
  useDollar = true
): { drawdownPct: number; drawdownDollar: number } {
  if (initialBalance <= 0 || trades.length === 0) {
    return { drawdownPct: 0, drawdownDollar: 0 };
  }
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let balance = initialBalance;
  let peak = initialBalance;
  let maxDD = 0;
  for (const t of sorted) {
    balance += tv(t, useDollar);
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;
  }
  const drawdownPct = peak > 0 ? round((maxDD / peak) * 100, 1) : 0;
  return { drawdownPct, drawdownDollar: round(maxDD, 2) };
}

/* ═══════════════════════════════════════════════
 * 6. Trade Time Performance (scatter)
 * ═══════════════════════════════════════════════ */

export type TimeScatterPoint = { hour: number; pnl: number; isWin: boolean; pair: string };

export function buildTradeTimePerformance(trades: CalendarTrade[], useDollar = false): TimeScatterPoint[] {
  return trades
    .filter((t) => t.entry_time != null)
    .map((t) => {
      const parts = t.entry_time!.split(":");
      const hour = parseInt(parts[0], 10) + (parseInt(parts[1] ?? "0", 10) / 60);
      return { hour: round(hour, 2), pnl: round(tv(t, useDollar), useDollar ? 2 : 1), isWin: t.is_win, pair: t.pair };
    });
}

/* ═══════════════════════════════════════════════
 * 7. Trade Duration Performance (scatter)
 * ═══════════════════════════════════════════════ */

export type DurationScatterPoint = { duration: number; durationLabel: string; pnl: number; isWin: boolean };

function fmtDuration(mins: number): string {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}

export function buildTradeDurationPerformance(trades: CalendarTrade[], useDollar = false): DurationScatterPoint[] {
  return trades
    .filter((t) => t.duration_minutes != null && t.duration_minutes > 0)
    .map((t) => ({
      duration: t.duration_minutes!,
      durationLabel: fmtDuration(t.duration_minutes!),
      pnl: round(tv(t, useDollar), useDollar ? 2 : 1),
      isWin: t.is_win,
    }));
}

/* ═══════════════════════════════════════════════
 * 8. Win% / Avg Win / Avg Loss (multi-line by week)
 * ═══════════════════════════════════════════════ */

export type WinAvgPoint = {
  date: string;
  winRate: number;
  avgWin: number;
  avgLoss: number;
};

export function buildWinAvgTimeSeries(trades: CalendarTrade[], useDollar = false): WinAvgPoint[] {
  const byWeek = new Map<string, CalendarTrade[]>();
  for (const t of trades) {
    const d = new Date(t.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const arr = byWeek.get(key) ?? [];
    arr.push(t);
    byWeek.set(key, arr);
  }

  const dec = useDollar ? 2 : 1;
  return Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekDate, weekTrades]) => {
      const wins = weekTrades.filter((t) => t.is_win);
      const losses = weekTrades.filter((t) => !t.is_win);
      const winRate = weekTrades.length > 0 ? round((wins.length / weekTrades.length) * 100) : 0;
      const avgWin = wins.length > 0 ? round(wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) / wins.length, dec) : 0;
      const avgLoss = losses.length > 0 ? round(losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) / losses.length, dec) : 0;
      return { date: weekDate.slice(5), winRate, avgWin, avgLoss };
    });
}

/* ═══════════════════════════════════════════════
 * 9. Yearly Calendar (heatmap por mês)
 * ═══════════════════════════════════════════════ */

export type YearlyMonthCell = { month: number; pnl: number; tradeCount: number };
export type YearlyRow = { year: number; months: YearlyMonthCell[]; totalPnl: number; totalTrades: number };

/* ═══════════════════════════════════════════════
 * 10. Performance Report Metrics (Summary, Days, Trades)
 * ═══════════════════════════════════════════════ */

export type PerformanceMetrics = {
  netPnl: number;
  winRate: number;
  avgDailyWinPct: number;
  winDays: number;
  lossDays: number;
  breakevenDays: number;
  profitFactor: number;
  tradeExpectancy: number;
  avgDailyWinLoss: number;
  avgTradeWinLoss: number;
  avgHoldTimeMinutes: number;
  avgNetTradePnl: number;
  avgDailyNetPnl: number;
  avgPlannedRMultiple: number | null;
  avgRealizedRMultiple: number | null;
  avgDailyVolume: number;
  loggedDays: number;
  maxDailyDrawdown: number;
  maxDrawdownPct: number;
  avgDailyDrawdown: number;
  largestProfitableDay: number;
  largestLosingDay: number;
  largestProfitableTrade: number;
  largestLosingTrade: number;
  longestTradeDurationMinutes: number | null;
  avgTradingDaysDurationMinutes: number;
  longsWinPct: number | null;
  shortsWinPct: number | null;
  totalTrades: number;
  wins: number;
  losses: number;
  avgWinDollar: number;
  avgLossDollar: number;
  totalDays: number;
  /** Overview / relatório completo */
  breakEvenTrades: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgHoldTimeWinningMinutes: number | null;
  avgHoldTimeLosingMinutes: number | null;
  avgHoldTimeScratchMinutes: number | null;
  avgWinningDayPnl: number;
  avgLosingDayPnl: number;
  maxConsecutiveWinningDays: number;
  maxConsecutiveLosingDays: number;
};

function fmtHoldTime(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h ${m}m`;
}

export function buildPerformanceMetrics(trades: CalendarTrade[], useDollar = true): PerformanceMetrics {
  const m = computeClientMetrics(trades);
  const dayRate = computeDayWinRate(trades, useDollar);
  const byDate = groupByDate(trades);

  const dollarVal = (t: CalendarTrade) => (useDollar && t.profit_dollar != null ? t.profit_dollar : t.pips);
  const wins = trades.filter((t) => t.is_win);
  const losses = trades.filter((t) => !t.is_win);

  let winDays = 0;
  let lossDays = 0;
  let breakevenDays = 0;
  const dailyPnls: number[] = [];
  let largestProfitableDay = 0;
  let largestLosingDay = 0;

  for (const [, dayTrades] of byDate) {
    const pnl = dayTrades.reduce((s, t) => s + dollarVal(t), 0);
    dailyPnls.push(pnl);
    if (pnl > 0) {
      winDays++;
      if (pnl > largestProfitableDay) largestProfitableDay = pnl;
    } else if (pnl < 0) {
      lossDays++;
      if (pnl < largestLosingDay) largestLosingDay = pnl;
    } else {
      breakevenDays++;
    }
  }

  const avgDailyWinPct = winDays + lossDays + breakevenDays > 0
    ? round((winDays / (winDays + lossDays + breakevenDays)) * 100)
    : 0;

  const tradeExpectancy = trades.length > 0
    ? round(
        (m.wins / m.totalTrades) * m.avgWinDollar -
        (m.losses / m.totalTrades) * m.avgLossDollar,
        2
      )
    : 0;

  const avgWinningDayPnl = winDays > 0
    ? dailyPnls.filter((p) => p > 0).reduce((a, b) => a + b, 0) / winDays
    : 0;
  const avgLosingDayPnl = lossDays > 0
    ? Math.abs(dailyPnls.filter((p) => p < 0).reduce((a, b) => a + b, 0) / lossDays)
    : 1;
  const avgDailyWinLoss = avgLosingDayPnl > 0 ? round(avgWinningDayPnl / avgLosingDayPnl, 2) : 0;

  const durations = trades
    .filter((t) => t.duration_minutes != null && t.duration_minutes > 0)
    .map((t) => t.duration_minutes!);
  const avgHoldTimeMinutes = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  const longestTradeDurationMinutes = durations.length > 0 ? Math.max(...durations) : null;

  const totalDays = byDate.size;
  const avgDailyNetPnl = totalDays > 0 ? round(m.netDollar / totalDays, 2) : 0;
  const avgDailyVolume = totalDays > 0 ? round(m.totalTrades / totalDays, 2) : 0;

  const rrTrades = trades.filter((t) => t.risk_reward != null && t.risk_reward !== 0);
  const avgPlannedRMultiple = rrTrades.length > 0
    ? round(rrTrades.reduce((s, t) => s + t.risk_reward!, 0) / rrTrades.length, 2)
    : null;
  const avgRealizedRMultiple = rrTrades.length > 0
    ? round(rrTrades.reduce((s, t) => s + t.risk_reward!, 0) / rrTrades.length, 2)
    : null;

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  let peak = 0;
  const drawdowns: number[] = [];
  for (const t of sorted) {
    cum += dollarVal(t);
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    drawdowns.push(dd);
  }
  const maxDD = drawdowns.length > 0 ? Math.max(...drawdowns) : 0;
  const maxDailyDrawdown = round(maxDD, 2);
  const maxDrawdownPct = peak > 0 ? round((maxDD / peak) * 100, 1) : 0;
  const avgDailyDrawdown = drawdowns.length > 0
    ? round(drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length, 2)
    : 0;

  const largestProfitableTrade = wins.length > 0
    ? round(Math.max(...wins.map((t) => Math.abs(dollarVal(t)))), 2)
    : 0;
  const largestLosingTrade = losses.length > 0
    ? round(Math.max(...losses.map((t) => Math.abs(dollarVal(t)))), 2)
    : 0;

  const longs = trades.filter((t) => t.pips >= 0);
  const shorts = trades.filter((t) => t.pips < 0);
  const longsWinPct = longs.length > 0
    ? round((longs.filter((t) => t.is_win).length / longs.length) * 100)
    : null;
  const shortsWinPct = shorts.length > 0
    ? round((shorts.filter((t) => t.is_win).length / shorts.length) * 100)
    : null;

  /* Break-even trades (pnl ≈ 0) */
  const breakEvenTrades = trades.filter((t) => {
    const v = dollarVal(t);
    return Math.abs(v) < 0.01;
  }).length;

  /* Max consecutive wins/losses */
  const sortedForSeq = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let curWins = 0;
  let curLosses = 0;
  for (const t of sortedForSeq) {
    if (t.is_win) {
      curWins++;
      curLosses = 0;
      if (curWins > maxConsecWins) maxConsecWins = curWins;
    } else {
      curLosses++;
      curWins = 0;
      if (curLosses > maxConsecLosses) maxConsecLosses = curLosses;
    }
  }

  /* Avg hold time by win/loss/scratch */
  const scratchTrades = trades.filter((t) => {
    const v = dollarVal(t);
    return t.duration_minutes != null && Math.abs(v) < 0.01;
  });
  const winningWithDur = trades.filter((t) => t.is_win && t.duration_minutes != null && t.duration_minutes > 0);
  const losingWithDur = trades.filter((t) => !t.is_win && Math.abs(dollarVal(t)) >= 0.01 && t.duration_minutes != null && t.duration_minutes > 0);
  const avgHoldTimeWinningMinutes = winningWithDur.length > 0
    ? round(winningWithDur.reduce((s, t) => s + t.duration_minutes!, 0) / winningWithDur.length)
    : null;
  const avgHoldTimeLosingMinutes = losingWithDur.length > 0
    ? round(losingWithDur.reduce((s, t) => s + t.duration_minutes!, 0) / losingWithDur.length)
    : null;
  const avgHoldTimeScratchMinutes = scratchTrades.length > 0
    ? round(scratchTrades.reduce((s, t) => s + (t.duration_minutes ?? 0), 0) / scratchTrades.length)
    : null;

  /* Max consecutive winning/losing days */
  const byDateOrder = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let maxConsecWinDays = 0;
  let maxConsecLossDays = 0;
  let curWinDays = 0;
  let curLossDays = 0;
  for (const [, dayTrades] of byDateOrder) {
    const pnl = dayTrades.reduce((s, t) => s + dollarVal(t), 0);
    if (pnl > 0) {
      curWinDays++;
      curLossDays = 0;
      if (curWinDays > maxConsecWinDays) maxConsecWinDays = curWinDays;
    } else if (pnl < 0) {
      curLossDays++;
      curWinDays = 0;
      if (curLossDays > maxConsecLossDays) maxConsecLossDays = curLossDays;
    } else {
      curWinDays = 0;
      curLossDays = 0;
    }
  }

  const dayDurations: number[] = [];
  for (const [, dayTrades] of byDate) {
    const dayMins = dayTrades
      .filter((t) => t.duration_minutes != null)
      .reduce((s, t) => s + (t.duration_minutes ?? 0), 0);
    if (dayMins > 0) dayDurations.push(dayMins);
  }
  const avgTradingDaysDurationMinutes = dayDurations.length > 0
    ? round(dayDurations.reduce((a, b) => a + b, 0) / dayDurations.length)
    : 0;

  return {
    netPnl: round(m.netDollar, 2),
    winRate: m.winRate,
    avgDailyWinPct,
    winDays,
    lossDays,
    breakevenDays,
    profitFactor: m.profitFactorDollar,
    tradeExpectancy,
    avgDailyWinLoss,
    avgTradeWinLoss: m.avgLossDollar > 0 ? round(m.avgWinDollar / m.avgLossDollar, 2) : m.avgWinDollar,
    avgHoldTimeMinutes: round(avgHoldTimeMinutes),
    avgNetTradePnl: m.totalTrades > 0 ? round(m.netDollar / m.totalTrades, 2) : 0,
    avgDailyNetPnl,
    avgPlannedRMultiple,
    avgRealizedRMultiple,
    avgDailyVolume,
    loggedDays: 0,
    maxDailyDrawdown: -maxDailyDrawdown,
    maxDrawdownPct,
    avgDailyDrawdown: -avgDailyDrawdown,
    largestProfitableDay: round(largestProfitableDay, 2),
    largestLosingDay: round(largestLosingDay, 2),
    largestProfitableTrade,
    largestLosingTrade,
    longestTradeDurationMinutes,
    avgTradingDaysDurationMinutes,
    longsWinPct,
    shortsWinPct,
    totalTrades: m.totalTrades,
    wins: m.wins,
    losses: m.losses,
    avgWinDollar: m.avgWinDollar,
    avgLossDollar: m.avgLossDollar,
    totalDays,
    breakEvenTrades,
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    avgHoldTimeWinningMinutes,
    avgHoldTimeLosingMinutes,
    avgHoldTimeScratchMinutes,
    avgWinningDayPnl: winDays > 0
      ? round(dailyPnls.filter((p) => p > 0).reduce((a, b) => a + b, 0) / winDays, 2)
      : 0,
    avgLosingDayPnl: lossDays > 0
      ? round(Math.abs(dailyPnls.filter((p) => p < 0).reduce((a, b) => a + b, 0) / lossDays), 2)
      : 0,
    maxConsecutiveWinningDays: maxConsecWinDays,
    maxConsecutiveLosingDays: maxConsecLossDays,
  };
}

/** Streak atual: positivo = vitórias, negativo = derrotas */
export function computeCurrentStreaks(trades: CalendarTrade[], useDollar = false): {
  tradeStreak: number;
  dayStreak: number;
} {
  if (trades.length === 0) return { tradeStreak: 0, dayStreak: 0 };
  const dollarVal = (t: CalendarTrade) => (useDollar && t.profit_dollar != null ? t.profit_dollar : t.pips);

  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let tradeStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].is_win) {
      if (tradeStreak >= 0) tradeStreak++;
      else break;
    } else {
      if (tradeStreak <= 0) tradeStreak--;
      else break;
    }
  }

  const byDate = groupByDate(trades);
  const byDateOrder = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let dayStreak = 0;
  for (let i = byDateOrder.length - 1; i >= 0; i--) {
    const pnl = byDateOrder[i][1].reduce((s, t) => s + dollarVal(t), 0);
    if (pnl > 0) {
      if (dayStreak >= 0) dayStreak++;
      else break;
    } else if (pnl < 0) {
      if (dayStreak <= 0) dayStreak--;
      else break;
    } else break;
  }

  return { tradeStreak, dayStreak };
}

export function buildYearlyCalendar(trades: CalendarTrade[], useDollar = false): YearlyRow[] {
  const byYearMonth = new Map<string, { pnl: number; count: number }>();
  for (const t of trades) {
    const key = t.date.slice(0, 7);
    const cur = byYearMonth.get(key) ?? { pnl: 0, count: 0 };
    cur.pnl += tv(t, useDollar);
    cur.count += 1;
    byYearMonth.set(key, cur);
  }

  const years = new Set<number>();
  for (const key of byYearMonth.keys()) {
    years.add(parseInt(key.slice(0, 4), 10));
  }

  const dec = useDollar ? 2 : 1;
  return Array.from(years)
    .sort((a, b) => b - a)
    .map((year) => {
      const months: YearlyMonthCell[] = [];
      let totalPnl = 0;
      let totalTrades = 0;
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, "0")}`;
        const data = byYearMonth.get(key);
        const pnl = data ? round(data.pnl, dec) : 0;
        const tradeCount = data?.count ?? 0;
        months.push({ month: m, pnl, tradeCount });
        totalPnl += pnl;
        totalTrades += tradeCount;
      }
      return { year, months, totalPnl: round(totalPnl, dec), totalTrades };
    });
}
