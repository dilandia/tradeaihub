import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type DbTrade = {
  id: string;
  user_id: string;
  trade_date: string;
  pair: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward: number | null;
  tags: string[];
  notes: string | null;
  import_id: string | null;
  created_at: string;
  updated_at: string;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  profit_dollar: number | null;
  trading_account_id: string | null;
  deleted_at: string | null;
};

export type TradeWithMetaApi = DbTrade & {
  metaapi_account_id: string | null;
};

export type DbImportSummary = {
  id: string;
  user_id: string;
  created_at: string;
  source_filename: string | null;
  account_name: string | null;
  account_number: string | null;
  broker: string | null;
  report_date: string | null;
  total_net_profit: number | null;
  gross_profit: number | null;
  gross_loss: number | null;
  profit_factor: number | null;
  expected_payoff: number | null;
  recovery_factor: number | null;
  sharpe_ratio: number | null;
  balance_drawdown_absolute: number | null;
  balance_drawdown_maximal: number | null;
  balance_drawdown_maximal_pct: number | null;
  balance_drawdown_relative_pct: number | null;
  balance_drawdown_relative: number | null;
  total_trades: number | null;
  short_trades: number | null;
  short_trades_won_pct: number | null;
  long_trades: number | null;
  long_trades_won_pct: number | null;
  profit_trades: number | null;
  profit_trades_pct: number | null;
  loss_trades: number | null;
  loss_trades_pct: number | null;
  largest_profit_trade: number | null;
  largest_loss_trade: number | null;
  average_profit_trade: number | null;
  average_loss_trade: number | null;
  max_consecutive_wins: number | null;
  max_consecutive_wins_money: number | null;
  max_consecutive_losses: number | null;
  max_consecutive_losses_money: number | null;
  max_consecutive_profit: number | null;
  max_consecutive_profit_count: number | null;
  max_consecutive_loss: number | null;
  max_consecutive_loss_count: number | null;
  imported_trades_count: number | null;
  deleted_at: string | null;
};

export type Metrics = {
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

/* ─────── Queries ─────── */

/** Busca o primeiro nome do usuário logado (para boas-vindas) - cached per request */
export const getUserFirstName = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Tenta do profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name
    || user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email;

  if (!fullName) return null;
  // Retorna só o primeiro nome
  return fullName.split(" ")[0];
});

/** Busca um trade específico por ID (excludes soft-deleted by default via RLS) */
export async function getTradeById(id: string): Promise<DbTrade | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data as DbTrade;
}

/** Busca trade com metaapi_account_id da conta (para OHLC via MetaApi). */
export async function getTradeWithMetaApiInfo(
  id: string
): Promise<TradeWithMetaApi | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: trade, error: tradeErr } = await supabase
    .from("trades")
    .select("*, trading_accounts(metaapi_account_id)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (tradeErr || !trade) return null;

  const account = (trade.trading_accounts as { metaapi_account_id: string | null } | null) ?? null;
  const { trading_accounts: _, ...rest } = trade as DbTrade & { trading_accounts?: unknown };

  return {
    ...rest,
    metaapi_account_id: account?.metaapi_account_id ?? null,
  } as TradeWithMetaApi;
}

/** Busca todos os trades do usuário (opcionalmente filtrado por import_id e/ou trading_account_id).
 *  By default, soft-deleted trades (deleted_at IS NOT NULL) are excluded by RLS.
 *  Pass include_deleted=true to also fetch deleted trades (requires admin/service role).
 *
 *  Note: Uses React.cache() for per-request caching (safe with cookies).
 *  unstable_cache() cannot be used here because getTrades calls createClient() which accesses cookies (dynamic data). */
export const getTrades = cache(
  async (
    importId?: string | null,
    tradingAccountId?: string | null,
    include_deleted?: boolean
  ): Promise<DbTrade[]> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false });

    if (importId) {
      query = query.eq("import_id", importId);
    }

    if (tradingAccountId) {
      query = query.eq("trading_account_id", tradingAccountId);
    }

    // RLS already filters deleted_at IS NULL for normal users.
    // For admin views that bypass RLS, apply explicit filter unless include_deleted is true.
    if (!include_deleted) {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as DbTrade[];
  }
);

/** Busca todos os import summaries do usuário (mais recente primeiro) - cached per request.
 *  Soft-deleted summaries are excluded by RLS + explicit filter. */
export const getImportSummaries = cache(async (): Promise<DbImportSummary[]> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("import_summaries")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as DbImportSummary[];
});

/** Busca um import summary específico (excludes soft-deleted) */
export async function getImportSummary(id: string): Promise<DbImportSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_summaries")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as DbImportSummary;
}

/**
 * Busca métricas calculadas na database via RPC (Phase 3: Query Consolidation).
 * Mais eficiente que carregar todos os trades e calcular em JavaScript.
 */
export async function getTradeMetricsRpc(
  importId?: string | null,
  tradingAccountId?: string | null
): Promise<Metrics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      netPips: 0, netDollar: 0,
      avgWinPips: 0, avgLossPips: 0,
      avgWinDollar: 0, avgLossDollar: 0,
      profitFactor: 0, profitFactorDollar: 0,
      avgRiskReward: null, zellaScore: 0,
      hasDollarData: false,
    };
  }

  const { data, error } = await supabase.rpc("get_trade_metrics", {
    p_user_id: user.id,
    p_import_id: importId ?? null,
    p_account_id: tradingAccountId ?? null,
  });

  if (error || !data || data.length === 0) {
    return {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      netPips: 0, netDollar: 0,
      avgWinPips: 0, avgLossPips: 0,
      avgWinDollar: 0, avgLossDollar: 0,
      profitFactor: 0, profitFactorDollar: 0,
      avgRiskReward: null, zellaScore: 0,
      hasDollarData: false,
    };
  }

  const m = data[0] as any;
  const totalTrades = m.total_trades ?? 0;
  const wins = m.winning_trades ?? 0;
  const losses = m.losing_trades ?? 0;
  const netPips = Number(m.net_pips ?? 0);
  const netDollar = Number(m.net_dollar ?? 0);
  const grossProfitPips = Number(m.gross_profit_pips ?? 0);
  const grossLossPips = Number(m.gross_loss_pips ?? 0);
  const grossProfitDollar = Number(m.gross_profit_dollar ?? 0);
  const grossLossDollar = Number(m.gross_loss_dollar ?? 0);

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWinPips = wins > 0 ? grossProfitPips / wins : 0;
  const avgLossPips = losses > 0 ? grossLossPips / losses : 0;
  const profitFactor = grossLossPips > 0 ? grossProfitPips / grossLossPips : grossProfitPips > 0 ? 99 : 0;
  const avgWinDollar = wins > 0 ? grossProfitDollar / wins : 0;
  const avgLossDollar = losses > 0 ? grossLossDollar / losses : 0;
  const profitFactorDollar = grossLossDollar > 0 ? grossProfitDollar / grossLossDollar : grossProfitDollar > 0 ? 99 : 0;
  const zellaScore = Math.round(Math.min(100, Math.max(0, (winRate / 100) * 40 + Math.min(profitFactor, 3) * 20)));

  const r = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

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
    avgRiskReward: null,
    zellaScore,
    hasDollarData: m.has_dollar_data ?? false,
  };
}

/**
 * Calcula métricas a partir de uma lista de trades.
 * Mantido para compatibilidade, mas prefira getTradeMetricsRpc() para novos códigos.
 */
export function computeMetrics(trades: DbTrade[]): Metrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0, wins: 0, losses: 0, winRate: 0,
      netPips: 0, netDollar: 0,
      avgWinPips: 0, avgLossPips: 0,
      avgWinDollar: 0, avgLossDollar: 0,
      profitFactor: 0, profitFactorDollar: 0,
      avgRiskReward: null, zellaScore: 0,
      hasDollarData: false,
    };
  }

  const wins = trades.filter((t) => t.is_win);
  const losses = trades.filter((t) => !t.is_win);
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

  // Pips
  const netPips = trades.reduce((s, t) => s + Number(t.pips), 0);
  const grossProfit = wins.reduce((s, t) => s + Math.abs(Number(t.pips)), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(Number(t.pips)), 0);
  const avgWinPips = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLossPips = losses.length > 0 ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

  // Dollar (usa profit_dollar quando disponível, senão fallback para pips)
  const hasDollarData = trades.some((t) => t.profit_dollar != null);
  const dollarVal = (t: DbTrade) => t.profit_dollar != null ? Number(t.profit_dollar) : Number(t.pips);
  const netDollar = trades.reduce((s, t) => s + dollarVal(t), 0);
  const grossProfitDollar = wins.reduce((s, t) => s + Math.abs(dollarVal(t)), 0);
  const grossLossDollar = losses.reduce((s, t) => s + Math.abs(dollarVal(t)), 0);
  const avgWinDollar = wins.length > 0 ? grossProfitDollar / wins.length : 0;
  const avgLossDollar = losses.length > 0 ? grossLossDollar / losses.length : 0;
  const profitFactorDollar = grossLossDollar > 0 ? grossProfitDollar / grossLossDollar : grossProfitDollar > 0 ? 99 : 0;

  const rrValues = trades.map((t) => t.risk_reward).filter((r): r is number => r != null);
  const avgRiskReward =
    rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : null;

  const zellaScore = Math.round(
    Math.min(100, Math.max(0, (winRate / 100) * 40 + Math.min(profitFactor, 3) * 20))
  );

  const r = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate: r(winRate),
    netPips: r(netPips),
    netDollar: r(netDollar, 2),
    avgWinPips: r(avgWinPips),
    avgLossPips: r(avgLossPips),
    avgWinDollar: r(avgWinDollar, 2),
    avgLossDollar: r(avgLossDollar, 2),
    profitFactor: r(profitFactor, 2),
    profitFactorDollar: r(profitFactorDollar, 2),
    avgRiskReward: avgRiskReward != null ? r(avgRiskReward) : null,
    zellaScore,
    hasDollarData,
  };
}

// Importa tipos do calendar-utils (client-safe) e re-exporta
import type {
  DayCell,
  WeekSummary,
  CalendarData,
  DayTradeDetail,
  CalendarTrade,
} from "@/lib/calendar-utils";
export type { DayCell, WeekSummary, CalendarData, DayTradeDetail, CalendarTrade };

export type PnlPoint = { date: string; cumulative: number };

export type TradeRow = {
  id: string;
  date: string;
  pair: string;
  pips: number;
  rr: number;
  win: boolean;
  tags?: string[];
};

/** Retorna o valor monetário de um trade: profit_dollar se disponível, senão pips */
function tradeValue(t: DbTrade): number {
  return t.profit_dollar != null ? Number(t.profit_dollar) : Number(t.pips);
}

/**
 * Monta dados completos do calendário para um mês: dias, semanas, totais.
 */
export function buildCalendarData(trades: DbTrade[], year: number, month: number): CalendarData {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const byDate = new Map<string, { pnl: number; count: number; wins: number }>();

  for (const t of trades) {
    if (!t.trade_date.startsWith(prefix)) continue;
    const key = t.trade_date;
    const cur = byDate.get(key) ?? { pnl: 0, count: 0, wins: 0 };
    cur.pnl += tradeValue(t);
    cur.count += 1;
    if (t.is_win) cur.wins += 1;
    byDate.set(key, cur);
  }

  const days: DayCell[] = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    pnl: Math.round(v.pnl * 10) / 10,
    tradesCount: v.count,
    wins: v.wins,
    losses: v.count - v.wins,
    winRate: v.count > 0 ? Math.round((v.wins / v.count) * 1000) / 10 : 0,
  }));

  // Calcula semanas (baseado na grid do calendário)
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay(); // 0=Sun

  const weeks: WeekSummary[] = [];
  let weekNum = 1;
  let weekPnl = 0;
  let weekDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayData = byDate.get(dateStr);
    if (dayData && dayData.count > 0) {
      weekPnl += dayData.pnl;
      weekDays += 1;
    }

    const dayOfWeek = (startPad + d - 1) % 7;
    // Sábado (6) ou último dia do mês = fim da semana
    if (dayOfWeek === 6 || d === daysInMonth) {
      weeks.push({ weekNum, pnl: Math.round(weekPnl * 10) / 10, tradingDays: weekDays });
      weekNum++;
      weekPnl = 0;
      weekDays = 0;
    }
  }

  const monthPnl = days.reduce((s, d) => s + d.pnl, 0);
  const monthTrades = days.reduce((s, d) => s + d.tradesCount, 0);

  return {
    days,
    weeks,
    monthPnl: Math.round(monthPnl * 10) / 10,
    monthTrades,
    monthTradingDays: days.filter((d) => d.tradesCount > 0).length,
  };
}

/** Retorna trades de um dia específico para o modal de detalhe */
export function getTradesForDay(trades: DbTrade[], date: string): DayTradeDetail[] {
  return trades
    .filter((t) => t.trade_date === date)
    .map((t) => ({
      id: t.id,
      time: t.created_at ? new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—",
      pair: t.pair,
      side: Number(t.pips) >= 0 ? "LONG" : "SHORT",
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pips: Number(t.pips),
      is_win: t.is_win,
      risk_reward: t.risk_reward,
    }));
}

/** Compat: mantém buildHeatmapDays para backward compat */
export function buildHeatmapDays(trades: DbTrade[], year: number, month: number): DayCell[] {
  return buildCalendarData(trades, year, month).days;
}

/**
 * Gera série de P&L cumulativo (ordenada por data).
 */
export function buildCumulativePnl(trades: DbTrade[]): PnlPoint[] {
  const byDate = new Map<string, number>();
  for (const t of trades) {
    const key = t.trade_date;
    byDate.set(key, (byDate.get(key) ?? 0) + tradeValue(t));
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  let cum = 0;
  return sorted.map(([date, pips]) => {
    cum += pips;
    return {
      date: date.slice(5),
      cumulative: Math.round(cum * 10) / 10,
    };
  });
}

/**
 * Mapeia DbTrade para formato da tabela recent trades.
 */
export function toTradeRows(trades: DbTrade[], limit = 10): TradeRow[] {
  return trades.slice(0, limit).map((t) => ({
    id: t.id,
    date: t.trade_date.slice(5).replace("-", "/"),
    pair: t.pair,
    pips: Number(t.pips),
    rr: t.risk_reward ?? 0,
    win: t.is_win,
    tags: t.tags?.length ? t.tags : undefined,
    profitDollar: t.profit_dollar != null ? Number(t.profit_dollar) : null,
  }));
}

/** Converte DbTrade[] para CalendarTrade[] (serializável para o client) */
export function toCalendarTrades(trades: DbTrade[]): CalendarTrade[] {
  return trades.map((t) => ({
    id: t.id,
    date: t.trade_date,
    time: t.created_at
      ? new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "—",
    pair: t.pair,
    pips: Number(t.pips),
    is_win: t.is_win,
    entry_price: t.entry_price,
    exit_price: t.exit_price,
    risk_reward: t.risk_reward,
    profit_dollar: t.profit_dollar ?? null,
    entry_time: t.entry_time ?? null,
    exit_time: t.exit_time ?? null,
    duration_minutes: t.duration_minutes != null ? Number(t.duration_minutes) : null,
    tags: t.tags?.length ? t.tags : undefined,
  }));
}
