/**
 * Funções de cálculo para as páginas de Reports.
 * Client-safe: trabalha com CalendarTrade[].
 */
import type { CalendarTrade } from "@/lib/calendar-utils";
import { getWeekdayNames, getMonthNamesShort } from "@/lib/i18n/date-utils";
import type { Locale } from "@/lib/i18n/config";

function round(val: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(val * f) / f;
}

function tv(t: CalendarTrade, useDollar: boolean): number {
  return useDollar && t.profit_dollar != null ? t.profit_dollar : t.pips;
}

/* ─── Day & Time ─── */

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DayStats = {
  day: string;
  dayNum: number;
  winRate: number;
  netPnl: number;
  tradeCount: number;
  avgDailyVolume: number;
  avgWin: number;
  avgLoss: number;
};

export function buildDayStats(
  trades: CalendarTrade[],
  useDollar = true,
  locale?: Locale
): DayStats[] {
  const dayNames = locale ? getWeekdayNames(locale, "short") : DAY_NAMES_EN;
  const byDay = new Map<number, CalendarTrade[]>();
  for (const t of trades) {
    const d = new Date(t.date);
    const dayNum = d.getDay();
    const arr = byDay.get(dayNum) ?? [];
    arr.push(t);
    byDay.set(dayNum, arr);
  }

  return [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
    const dayTrades = byDay.get(dayNum) ?? [];
    const wins = dayTrades.filter((t) => t.is_win);
    const losses = dayTrades.filter((t) => !t.is_win);
    const winRate =
      dayTrades.length > 0
        ? round((wins.length / dayTrades.length) * 100)
        : 0;
    const netPnl = dayTrades.reduce((s, t) => s + tv(t, useDollar), 0);
    const avgWin =
      wins.length > 0
        ? round(
            wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
              wins.length,
            useDollar ? 2 : 1
          )
        : 0;
    const avgLoss =
      losses.length > 0
        ? round(
            losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
              losses.length,
            useDollar ? 2 : 1
          )
        : 0;

    const byDate = new Map<string, number>();
    for (const t of dayTrades) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
    }
    const avgDailyVolume =
      byDate.size > 0
        ? round(
            dayTrades.length / byDate.size,
            2
          )
        : 0;

    return {
      day: dayNames[dayNum],
      dayNum,
      winRate,
      netPnl: round(netPnl, useDollar ? 2 : 1),
      tradeCount: dayTrades.length,
      avgDailyVolume,
      avgWin,
      avgLoss,
    };
  });
}

export type DayTimeKpis = {
  bestDay: { day: string; trades: number; pnl: number };
  worstDay: { day: string; trades: number; pnl: number };
  mostActiveDay: { day: string; trades: number };
  bestWinRateDay: { day: string; winRate: number; trades: number };
};

export function buildDayTimeKpis(
  trades: CalendarTrade[],
  useDollar = true,
  locale?: Locale
): DayTimeKpis | null {
  const stats = buildDayStats(trades, useDollar, locale);
  const withTrades = stats.filter((s) => s.tradeCount > 0);
  if (withTrades.length === 0) return null;

  const best = withTrades.reduce((a, b) =>
    a.netPnl > b.netPnl ? a : b
  );
  const worst = withTrades.reduce((a, b) =>
    a.netPnl < b.netPnl ? a : b
  );
  const mostActive = withTrades.reduce((a, b) =>
    a.tradeCount > b.tradeCount ? a : b
  );
  const bestWr = withTrades.filter((s) => s.tradeCount >= 3).reduce(
    (a, b) => (a.winRate > b.winRate ? a : b),
    withTrades[0]
  );

  return {
    bestDay: { day: best.day, trades: best.tradeCount, pnl: best.netPnl },
    worstDay: { day: worst.day, trades: worst.tradeCount, pnl: worst.netPnl },
    mostActiveDay: { day: mostActive.day, trades: mostActive.tradeCount },
    bestWinRateDay: {
      day: bestWr.day,
      winRate: bestWr.winRate,
      trades: bestWr.tradeCount,
    },
  };
}

/* ─── Symbols ─── */

export type SymbolStats = {
  symbol: string;
  winRate: number;
  netPnl: number;
  tradeCount: number;
  avgDailyVolume: number;
  avgWin: number;
  avgLoss: number;
};

export function buildSymbolStats(
  trades: CalendarTrade[],
  useDollar = true
): SymbolStats[] {
  const bySymbol = new Map<string, CalendarTrade[]>();
  for (const t of trades) {
    const arr = bySymbol.get(t.pair) ?? [];
    arr.push(t);
    bySymbol.set(t.pair, arr);
  }

  return Array.from(bySymbol.entries())
    .map(([symbol, symbolTrades]) => {
      const wins = symbolTrades.filter((t) => t.is_win);
      const losses = symbolTrades.filter((t) => !t.is_win);
      const winRate =
        symbolTrades.length > 0
          ? round((wins.length / symbolTrades.length) * 100)
          : 0;
      const netPnl = symbolTrades.reduce(
        (s, t) => s + tv(t, useDollar),
        0
      );
      const byDate = new Map<string, number>();
      for (const t of symbolTrades) {
        byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
      }
      const avgDailyVolume =
        byDate.size > 0
          ? round(symbolTrades.length / byDate.size, 2)
          : 0;
      const avgWin =
        wins.length > 0
          ? round(
              wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
                wins.length,
              useDollar ? 2 : 1
            )
          : 0;
      const avgLoss =
        losses.length > 0
          ? round(
              losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
                losses.length,
              useDollar ? 2 : 1
            )
          : 0;

      return {
        symbol,
        winRate,
        netPnl: round(netPnl, useDollar ? 2 : 1),
        tradeCount: symbolTrades.length,
        avgDailyVolume,
        avgWin,
        avgLoss,
      };
    })
    .sort((a, b) => b.tradeCount - a.tradeCount);
}

export type SymbolKpis = {
  best: { symbol: string; trades: number; pnl: number };
  worst: { symbol: string; trades: number; pnl: number };
  mostActive: { symbol: string; trades: number };
  bestWinRate: { symbol: string; winRate: number; trades: number };
};

export function buildSymbolKpis(
  trades: CalendarTrade[],
  useDollar = true
): SymbolKpis | null {
  const stats = buildSymbolStats(trades, useDollar);
  if (stats.length === 0) return null;

  const best = stats.reduce((a, b) => (a.netPnl > b.netPnl ? a : b));
  const worst = stats.reduce((a, b) => (a.netPnl < b.netPnl ? a : b));
  const mostActive = stats.reduce((a, b) =>
    a.tradeCount > b.tradeCount ? a : b
  );
  const bestWr = stats.filter((s) => s.tradeCount >= 3).reduce(
    (a, b) => (a.winRate > b.winRate ? a : b),
    stats[0]
  );

  return {
    best: { symbol: best.symbol, trades: best.tradeCount, pnl: best.netPnl },
    worst: { symbol: worst.symbol, trades: worst.tradeCount, pnl: worst.netPnl },
    mostActive: { symbol: mostActive.symbol, trades: mostActive.tradeCount },
    bestWinRate: {
      symbol: bestWr.symbol,
      winRate: bestWr.winRate,
      trades: bestWr.tradeCount,
    },
  };
}

/* ─── Tags ─── */

export function buildTagStats(
  trades: CalendarTrade[],
  useDollar = true
): SymbolStats[] {
  const byTag = new Map<string, CalendarTrade[]>();
  for (const t of trades) {
    const tags = t.tags ?? [];
    if (tags.length === 0) {
      const arr = byTag.get("Sem tag") ?? [];
      arr.push(t);
      byTag.set("Sem tag", arr);
    } else {
      for (const tag of tags) {
        const arr = byTag.get(tag) ?? [];
        arr.push(t);
        byTag.set(tag, arr);
      }
    }
  }

  return Array.from(byTag.entries())
    .map(([tag, tagTrades]) => {
      const wins = tagTrades.filter((t) => t.is_win);
      const losses = tagTrades.filter((t) => !t.is_win);
      const winRate =
        tagTrades.length > 0
          ? round((wins.length / tagTrades.length) * 100)
          : 0;
      const netPnl = tagTrades.reduce(
        (s, t) => s + tv(t, useDollar),
        0
      );
      const byDate = new Map<string, number>();
      for (const t of tagTrades) {
        byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
      }
      const avgDailyVolume =
        byDate.size > 0
          ? round(tagTrades.length / byDate.size, 2)
          : 0;
      const avgWin =
        wins.length > 0
          ? round(
              wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
                wins.length,
              useDollar ? 2 : 1
            )
          : 0;
      const avgLoss =
        losses.length > 0
          ? round(
              losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
                losses.length,
              useDollar ? 2 : 1
            )
          : 0;

      return {
        symbol: tag,
        winRate,
        netPnl: round(netPnl, useDollar ? 2 : 1),
        tradeCount: tagTrades.length,
        avgDailyVolume,
        avgWin,
        avgLoss,
      };
    })
    .sort((a, b) => b.tradeCount - a.tradeCount);
}

/* ─── Risk (R-multiples buckets) ─── */

export type RiskBucket = {
  label: string;
  minR: number;
  maxR: number;
  winRate: number;
  netPnl: number;
  tradeCount: number;
  avgDailyVolume: number;
  avgWin: number;
  avgLoss: number;
};

const R_BUCKETS = [
  { label: "<0R", minR: -999, maxR: 0 },
  { label: "0 - 0.5R", minR: 0, maxR: 0.5 },
  { label: "0.5 - 1R", minR: 0.5, maxR: 1 },
  { label: "1 - 2R", minR: 1, maxR: 2 },
  { label: "2 - 3R", minR: 2, maxR: 3 },
  { label: "3R+", minR: 3, maxR: 999 },
];

/* ─── Cross Analysis (Day x Symbol) ─── */

export type CrossAnalysisMode = "winrate" | "pnl" | "trades";

export function buildCrossAnalysisSymbolMonth(
  trades: CalendarTrade[],
  topN = 10,
  mode: CrossAnalysisMode = "pnl",
  useDollar = true,
  locale?: Locale
): { symbols: string[]; months: string[]; cells: Map<string, number> } {
  const symbolStats = buildSymbolStats(trades, useDollar);
  const topSymbols = symbolStats.slice(0, topN).map((s) => s.symbol);
  const monthNames = locale ? getMonthNamesShort(locale) : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cells = new Map<string, number>();

  for (const sym of topSymbols) {
    for (let m = 1; m <= 12; m++) {
      const prefix = `-${String(m).padStart(2, "0")}-`;
      const monthTrades = trades.filter(
        (t) => t.pair === sym && t.date.includes(prefix)
      );
      let val = 0;
      if (mode === "pnl") {
        val = monthTrades.reduce((s, t) => s + tv(t, useDollar), 0);
      } else if (mode === "trades") {
        val = monthTrades.length;
      } else {
        val =
          monthTrades.length > 0
            ? round((monthTrades.filter((t) => t.is_win).length / monthTrades.length) * 100)
            : 0;
      }
      cells.set(`${sym}-${monthNames[m - 1]}`, val);
    }
  }

  return { symbols: topSymbols, months: monthNames, cells };
}

export function buildCrossAnalysisDaySymbol(
  trades: CalendarTrade[],
  topN = 10,
  mode: CrossAnalysisMode = "pnl",
  useDollar = true,
  locale?: Locale
): { days: string[]; symbols: string[]; cells: Map<string, number> } {
  const symbolStats = buildSymbolStats(trades, useDollar);
  const topSymbols = symbolStats.slice(0, topN).map((s) => s.symbol);
  const symbolSet = new Set(topSymbols);

  const days = locale ? getWeekdayNames(locale, "short") : DAY_NAMES_EN;
  const cells = new Map<string, number>();

  for (let dayNum = 0; dayNum < 7; dayNum++) {
    const day = days[dayNum];
    for (const sym of topSymbols) {
      const dayTrades = trades.filter((t) => {
        const d = new Date(t.date);
        return d.getDay() === dayNum && t.pair === sym;
      });
      let val = 0;
      if (mode === "pnl") {
        val = dayTrades.reduce((s, t) => s + tv(t, useDollar), 0);
      } else if (mode === "trades") {
        val = dayTrades.length;
      } else {
        val =
          dayTrades.length > 0
            ? round((dayTrades.filter((t) => t.is_win).length / dayTrades.length) * 100)
            : 0;
      }
      cells.set(`${day}-${sym}`, val);
    }
  }

  return { days, symbols: topSymbols, cells };
}

/** Calcula R realizado para trades sem R:R planejado (fallback). Usa avg_loss como 1R. */
function computeFallbackRR(trades: CalendarTrade[], useDollar: boolean): Map<string, number> {
  const losses = trades.filter((t) => !t.is_win);
  const wins = trades.filter((t) => t.is_win);
  const avgLoss =
    losses.length > 0
      ? losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) / losses.length
      : wins.length > 0
        ? wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) / wins.length
        : 1;
  const fallback = new Map<string, number>();
  for (const t of trades) {
    if (t.risk_reward == null || t.risk_reward <= 0) {
      const val = tv(t, useDollar);
      const rr = avgLoss > 0 ? round(val / avgLoss, 2) : 0;
      fallback.set(t.id, rr);
    }
  }
  return fallback;
}

export function buildRiskStats(
  trades: CalendarTrade[],
  useDollar = true
): RiskBucket[] {
  const fallbackRR = computeFallbackRR(trades, useDollar);

  const getRR = (t: CalendarTrade): number => {
    if (t.risk_reward != null && t.risk_reward > 0) return t.risk_reward;
    return fallbackRR.get(t.id) ?? 0;
  };

  const buckets: RiskBucket[] = R_BUCKETS.map(({ label, minR, maxR }) => {
    const bucketTrades = trades.filter((t) => {
      const rr = getRR(t);
      return rr >= minR && rr < maxR;
    });
    const wins = bucketTrades.filter((t) => t.is_win);
    const losses = bucketTrades.filter((t) => !t.is_win);
    const winRate =
      bucketTrades.length > 0
        ? round((wins.length / bucketTrades.length) * 100)
        : 0;
    const netPnl = bucketTrades.reduce(
      (s, t) => s + tv(t, useDollar),
      0
    );
    const byDate = new Map<string, number>();
    for (const t of bucketTrades) {
      byDate.set(t.date, (byDate.get(t.date) ?? 0) + 1);
    }
    const avgDailyVolume =
      byDate.size > 0
        ? round(bucketTrades.length / byDate.size, 2)
        : 0;
    const avgWin =
      wins.length > 0
        ? round(
            wins.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
              wins.length,
            useDollar ? 2 : 1
          )
        : 0;
    const avgLoss =
      losses.length > 0
        ? round(
            losses.reduce((s, t) => s + Math.abs(tv(t, useDollar)), 0) /
              losses.length,
            useDollar ? 2 : 1
          )
        : 0;

    return {
      label,
      minR,
      maxR,
      winRate,
      netPnl: round(netPnl, useDollar ? 2 : 1),
      tradeCount: bucketTrades.length,
      avgDailyVolume,
      avgWin,
      avgLoss,
    };
  }).filter((b) => b.tradeCount > 0);

  return buckets;
}
