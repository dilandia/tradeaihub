/**
 * Utilitários client-safe para o calendário do dashboard.
 * Este arquivo NÃO importa nada de server (Supabase, cookies, etc).
 */

export type DayCell = {
  date: string;
  pnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
};

export type WeekSummary = {
  weekNum: number;
  pnl: number;
  tradingDays: number;
};

export type CalendarData = {
  days: DayCell[];
  weeks: WeekSummary[];
  monthPnl: number;
  monthTrades: number;
  monthTradingDays: number;
};

export type DayTradeDetail = {
  id: string;
  time: string;
  pair: string;
  side: string;
  entry_price: number;
  exit_price: number;
  pips: number;
  is_win: boolean;
  risk_reward: number | null;
};

export type CalendarTrade = {
  id: string;
  date: string;
  time: string;
  pair: string;
  pips: number;
  is_win: boolean;
  entry_price: number;
  exit_price: number;
  risk_reward: number | null;
  profit_dollar: number | null;
  entry_time: string | null;
  exit_time: string | null;
  duration_minutes: number | null;
  tags?: string[];
};

/** Monta CalendarData a partir de CalendarTrade[] */
export function buildCalendarDataFromTrades(
  trades: CalendarTrade[],
  year: number,
  month: number,
  useDollar = false
): CalendarData {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const byDate = new Map<string, { pnl: number; count: number; wins: number }>();

  for (const t of trades) {
    if (!t.date.startsWith(prefix)) continue;
    const cur = byDate.get(t.date) ?? { pnl: 0, count: 0, wins: 0 };
    const val = useDollar && t.profit_dollar != null ? t.profit_dollar : t.pips;
    cur.pnl += val;
    cur.count += 1;
    if (t.is_win) cur.wins += 1;
    byDate.set(t.date, cur);
  }

  const days: DayCell[] = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    pnl: Math.round(v.pnl * 10) / 10,
    tradesCount: v.count,
    wins: v.wins,
    losses: v.count - v.wins,
    winRate: v.count > 0 ? Math.round((v.wins / v.count) * 1000) / 10 : 0,
  }));

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

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

/** Filtra trades de um dia a partir de CalendarTrade[] */
export function filterTradesForDay(trades: CalendarTrade[], date: string): DayTradeDetail[] {
  return trades
    .filter((t) => t.date === date)
    .map((t) => ({
      id: t.id,
      time: t.time,
      pair: t.pair,
      side: t.pips >= 0 ? "LONG" : "SHORT",
      entry_price: t.entry_price,
      exit_price: t.exit_price,
      pips: t.pips,
      is_win: t.is_win,
      risk_reward: t.risk_reward,
    }));
}
