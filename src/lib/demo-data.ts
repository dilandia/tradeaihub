/**
 * Dados demonstrativos para novos usuários sem trades importados.
 * Simula ~3 meses de performance para dar noção de como a plataforma funciona.
 */

import type { CalendarTrade } from "@/lib/calendar-utils";
import type { PnlPoint } from "@/lib/trades";
import type { ReportMetrics } from "@/components/dashboard/report-metrics-panel";

const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"] as const;

function seeded(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function demoTrade(
  id: string,
  date: string,
  pair: string,
  pips: number,
  isWin: boolean,
  profitDollar: number,
  seed: number
): CalendarTrade {
  const entry = 1.05 + seeded(seed) * 0.1;
  const exit = entry + (pips / 10000) * (isWin ? 1 : -1);
  return {
    id: `demo-${id}`,
    date,
    time: `${String(9 + Math.floor(seeded(seed + 1) * 8)).padStart(2, "0")}:${String(Math.floor(seeded(seed + 2) * 60)).padStart(2, "0")}`,
    pair,
    pips,
    is_win: isWin,
    entry_price: Math.round(entry * 100000) / 100000,
    exit_price: Math.round(exit * 100000) / 100000,
    risk_reward: isWin ? 1.2 + Math.random() * 0.8 : null,
    profit_dollar: profitDollar,
    entry_time: null,
    exit_time: null,
    duration_minutes: 30 + Math.floor(Math.random() * 180),
    tags: Math.random() > 0.7 ? ["scalp", "swing"] : undefined,
  };
}

/** Gera trades demo para os últimos ~3 meses */
function buildDemoTrades(): CalendarTrade[] {
  const trades: CalendarTrade[] = [];
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);

  let id = 1;
  const winRate = 0.58;
  const avgWinPips = 45;
  const avgLossPips = -32;
  const avgWinDollar = 125;
  const avgLossDollar = -85;

  for (let d = 0; d < 90; d++) {
    const date = new Date(start);
    date.setDate(date.getDate() + d);
    if (date > new Date()) break;
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const tradesPerDay = seeded(d * 7) > 0.4 ? 1 + Math.floor(seeded(d * 11) * 3) : 0;
    for (let t = 0; t < tradesPerDay; t++) {
      const isWin = seeded(d * 13 + t) < winRate;
      const pips = isWin
        ? avgWinPips + (seeded(d * 17 + t) - 0.5) * 30
        : avgLossPips + (seeded(d * 19 + t) - 0.5) * 20;
      const profitDollar = isWin
        ? avgWinDollar + (seeded(d * 23 + t) - 0.5) * 80
        : avgLossDollar + (seeded(d * 29 + t) - 0.5) * 50;

      trades.push(
        demoTrade(
          String(id++),
          date.toISOString().slice(0, 10),
          PAIRS[Math.floor(seeded(d * 31 + t) * PAIRS.length)],
          Math.round(pips * 10) / 10,
          isWin,
          Math.round(profitDollar * 100) / 100,
          d * 100 + t
        )
      );
    }
  }

  return trades.sort((a, b) => a.date.localeCompare(b.date));
}

const DEMO_TRADES = buildDemoTrades();

/** Trades demonstrativos no formato CalendarTrade */
export function getDemoCalendarTrades(): CalendarTrade[] {
  return DEMO_TRADES;
}

/** P&L cumulativo dos trades demo */
export function getDemoPnlPoints(): PnlPoint[] {
  const byDate = new Map<string, number>();
  for (const t of DEMO_TRADES) {
    const val = t.profit_dollar ?? t.pips;
    byDate.set(t.date, (byDate.get(t.date) ?? 0) + val);
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let cum = 0;
  return sorted.map(([date, val]) => {
    cum += val;
    return { date: date.slice(5), cumulative: Math.round(cum * 10) / 10 };
  });
}

/** Métricas do relatório demo (simulando import_summary) */
export function getDemoReportMetrics(): ReportMetrics {
  const wins = DEMO_TRADES.filter((t) => t.is_win);
  const losses = DEMO_TRADES.filter((t) => !t.is_win);
  const grossProfit = wins.reduce((s, t) => s + Math.abs(t.profit_dollar ?? t.pips), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.profit_dollar ?? t.pips), 0);
  const netProfit = DEMO_TRADES.reduce((s, t) => s + (t.profit_dollar ?? t.pips), 0);

  return {
    totalNetProfit: Math.round(netProfit * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : null,
    expectedPayoff: DEMO_TRADES.length > 0 ? Math.round((netProfit / DEMO_TRADES.length) * 100) / 100 : null,
    recoveryFactor: null,
    sharpeRatio: null,
    drawdownAbsolute: -1250,
    drawdownMaximal: -1850,
    drawdownMaximalPct: -8.2,
    drawdownRelativePct: -6.5,
    drawdownRelative: -1200,
    totalTrades: DEMO_TRADES.length,
    shortTrades: Math.floor(DEMO_TRADES.length * 0.45),
    shortTradesWonPct: 56,
    longTrades: Math.floor(DEMO_TRADES.length * 0.55),
    longTradesWonPct: 60,
    profitTrades: wins.length,
    profitTradesPct: Math.round((wins.length / DEMO_TRADES.length) * 1000) / 10,
    lossTrades: losses.length,
    lossTradesPct: Math.round((losses.length / DEMO_TRADES.length) * 1000) / 10,
    largestProfit: 420,
    largestLoss: -280,
    avgProfit: Math.round((grossProfit / wins.length) * 100) / 100,
    avgLoss: Math.round((grossLoss / losses.length) * 100) / 100,
    maxConsWins: 7,
    maxConsWinsMoney: 890,
    maxConsLosses: 4,
    maxConsLossesMoney: -420,
    accountName: "Conta Demo",
    broker: "MT5 Demo",
    importedCount: DEMO_TRADES.length,
  };
}

/** Saldo inicial para ROI (simulado) */
export const DEMO_INITIAL_BALANCE = 25000;
