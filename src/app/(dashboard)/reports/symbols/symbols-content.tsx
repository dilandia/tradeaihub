"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import {
  buildSymbolStats,
  buildSymbolKpis,
  buildCrossAnalysisSymbolMonth,
} from "@/lib/reports-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { trades: CalendarTrade[] };

function fmtPnl(v: number, useDollar: boolean): string {
  if (useDollar) {
    return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} pips`;
}

export function SymbolsContent({ trades }: Props) {
  const { t, locale } = useLanguage();
  const [useDollar] = useState(true);
  const [crossMode, setCrossMode] = useState<"winrate" | "pnl" | "trades">("pnl");

  const stats = useMemo(() => buildSymbolStats(trades, useDollar), [trades, useDollar]);
  const kpis = useMemo(() => buildSymbolKpis(trades, useDollar), [trades, useDollar]);
  const crossAnalysis = useMemo(
    () => buildCrossAnalysisSymbolMonth(trades, 10, crossMode, useDollar, locale),
    [trades, crossMode, useDollar, locale]
  );

  const chartData = useMemo(
    () =>
      stats.map((s) => ({
        symbol: s.symbol,
        netPnl: s.netPnl,
        tradeCount: s.tradeCount,
        winRate: s.winRate,
      })),
    [stats]
  );

  const empty = trades.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("symbols.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("symbols.description")}
        </p>
      </div>

      {!empty && kpis && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">{t("symbols.bestSymbol")}</span>
              </div>
              <p className="mt-1 font-semibold text-profit">{kpis.best.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.best.trades} trades · {fmtPnl(kpis.best.pnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">{t("symbols.worstSymbol")}</span>
              </div>
              <p className="mt-1 font-semibold text-loss">{kpis.worst.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.worst.trades} trades · {fmtPnl(kpis.worst.pnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">{t("symbols.mostActive")}</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.mostActive.symbol}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.mostActive.trades} trades
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">{t("symbols.bestWinRate")}</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.bestWinRate.symbol}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.bestWinRate.winRate}% / {kpis.bestWinRate.trades} trades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Não há trades que correspondam ao filtro atual.
            </p>
          </CardContent>
        </Card>
      )}

      {!empty && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Net P&L e Trade Count por símbolo
                <WidgetTooltip text="Lucro e prejuízo líquido e número de trades por símbolo." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="symbol"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                      tickFormatter={(v) => (useDollar ? `$${v}` : `${v}`)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "Net P&L" ? fmtPnl(value, useDollar) : value,
                        name === "Net P&L" ? "Net P&L" : "Trades",
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="netPnl" fill="var(--profit)" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="tradeCount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Win % por símbolo
                <WidgetTooltip text="Taxa de vitória por símbolo." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="symbol"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number) => [`${value}%`, "Win %"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="winRate"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!empty && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Símbolo</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Win %</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Net P&L</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Trades</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Avg vol</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Avg win</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Avg loss</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.symbol} className="border-b border-border/50">
                      <td className="py-2 font-medium">{s.symbol}</td>
                      <td className="py-2 text-right">{s.winRate}%</td>
                      <td
                        className={cn(
                          "py-2 text-right font-medium",
                          s.netPnl >= 0 ? "text-profit" : "text-loss"
                        )}
                      >
                        {fmtPnl(s.netPnl, useDollar)}
                      </td>
                      <td className="py-2 text-right">{s.tradeCount}</td>
                      <td className="py-2 text-right">{s.avgDailyVolume.toFixed(2)}</td>
                      <td className="py-2 text-right text-profit">{fmtPnl(s.avgWin, useDollar)}</td>
                      <td className="py-2 text-right text-loss">{fmtPnl(s.avgLoss, useDollar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!empty && crossAnalysis.symbols.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Cross analysis</CardTitle>
            <div className="flex items-center gap-2">
              {(["winrate", "pnl", "trades"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCrossMode(m)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors",
                    crossMode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {m === "winrate" ? "Win rate" : m === "pnl" ? "P&L" : "Trades"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Símbolo</th>
                    {crossAnalysis.months.map((m) => (
                      <th key={m} className="pb-2 text-right font-medium text-muted-foreground">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crossAnalysis.symbols.map((sym) => (
                    <tr key={sym} className="border-b border-border/50">
                      <td className="py-2 font-medium">{sym}</td>
                      {crossAnalysis.months.map((month) => {
                        const val = crossAnalysis.cells.get(`${sym}-${month}`) ?? 0;
                        return (
                          <td
                            key={month}
                            className={cn(
                              "py-2 text-right font-medium",
                              crossMode === "pnl" && val > 0 && "bg-profit/10 text-profit",
                              crossMode === "pnl" && val < 0 && "bg-loss/10 text-loss"
                            )}
                          >
                            {crossMode === "pnl"
                              ? fmtPnl(val, useDollar)
                              : crossMode === "winrate"
                                ? `${val}%`
                                : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
