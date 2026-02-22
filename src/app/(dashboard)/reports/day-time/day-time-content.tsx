"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import {
  buildDayStats,
  buildDayTimeKpis,
  buildCrossAnalysisDaySymbol,
  type CrossAnalysisMode,
} from "@/lib/reports-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";

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

export function DayTimeContent({ trades }: Props) {
  const { locale } = useLanguage();
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Day-Time-Report");
  const [useDollar] = useState(true);
  const [crossMode, setCrossMode] = useState<CrossAnalysisMode>("pnl");

  const stats = useMemo(() => buildDayStats(trades, useDollar, locale), [trades, useDollar, locale]);
  const kpis = useMemo(() => buildDayTimeKpis(trades, useDollar, locale), [trades, useDollar, locale]);
  const crossAnalysis = useMemo(
    () => buildCrossAnalysisDaySymbol(trades, 10, crossMode, useDollar, locale),
    [trades, crossMode, useDollar, locale]
  );

  const chartData = useMemo(
    () =>
      stats.map((s) => ({
        day: s.day,
        netPnl: s.netPnl,
        tradeCount: s.tradeCount,
        winRate: s.winRate,
      })),
    [stats]
  );

  const empty = trades.length === 0;

  return (
    <div className="space-y-6" ref={exportRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Day & Time</h1>
          <p className="text-sm text-muted-foreground">
            Análise de performance por dia da semana.
          </p>
        </div>
        <ExportPdfButton
          onExport={handleExport}
          isExporting={isExporting}
          canExport={canExport}
        />
      </div>

      {/* KPIs */}
      {!empty && kpis && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Melhor dia</span>
              </div>
              <p className="mt-1 font-semibold text-profit">
                {kpis.bestDay.day}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.bestDay.trades} trades · {fmtPnl(kpis.bestDay.pnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Pior dia</span>
              </div>
              <p className="mt-1 font-semibold text-loss">
                {kpis.worstDay.day}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.worstDay.trades} trades · {fmtPnl(kpis.worstDay.pnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Dia mais ativo</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.mostActiveDay.day}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.mostActiveDay.trades} trades
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">Melhor win rate</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.bestWinRateDay.day}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.bestWinRateDay.winRate}% / {kpis.bestWinRateDay.trades} trades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Não há trades que correspondam ao filtro atual.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione uma conta ou relatório importado em &quot;Fonte de dados&quot;.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {!empty && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Net P&L e Trade Count por dia
                <WidgetTooltip text="Lucro e prejuízo líquido e número de trades por dia da semana." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
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
                      labelStyle={{ color: "var(--foreground)" }}
                      formatter={(value: number, name: string) => [
                        name === "Net P&L" ? fmtPnl(value, useDollar) : value,
                        name === "Net P&L" ? "Net P&L" : "Trades",
                      ]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tradeCount"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ fill: "var(--primary)" }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="netPnl"
                      stroke="var(--profit)"
                      fill="var(--profit)"
                      fillOpacity={0.2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Win % por dia
                <WidgetTooltip text="Taxa de vitória por dia da semana." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
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

      {/* Summary table */}
      {!empty && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Dia</th>
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
                    <tr key={s.day} className="border-b border-border/50">
                      <td className="py-2 font-medium">{s.day}</td>
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

      {/* Cross analysis */}
      {!empty && crossAnalysis.symbols.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Cross analysis</CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCrossMode("winrate")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  crossMode === "winrate"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Win rate
              </button>
              <button
                type="button"
                onClick={() => setCrossMode("pnl")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  crossMode === "pnl"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                P&L
              </button>
              <button
                type="button"
                onClick={() => setCrossMode("trades")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  crossMode === "trades"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Trades
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Dia</th>
                    {crossAnalysis.symbols.map((sym) => (
                      <th key={sym} className="pb-2 text-right font-medium text-muted-foreground">
                        {sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crossAnalysis.days.map((day) => (
                    <tr key={day} className="border-b border-border/50">
                      <td className="py-2 font-medium">{day}</td>
                      {crossAnalysis.symbols.map((sym) => {
                        const val = crossAnalysis.cells.get(`${day}-${sym}`) ?? 0;
                        return (
                          <td
                            key={sym}
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
