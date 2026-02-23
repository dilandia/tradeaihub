"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { buildStrategyStats } from "@/lib/reports-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import type { Strategy } from "@/app/actions/strategies";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";

type Props = {
  trades: CalendarTrade[];
  strategies: Strategy[];
};

function fmtPnl(v: number): string {
  return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function StrategiesContent({ trades, strategies }: Props) {
  const { t } = useLanguage();
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Strategies-Report");

  /* Build name/color lookup from Strategy[] */
  const strategyMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    for (const s of strategies) {
      m.set(s.id, { name: s.name, color: s.color });
    }
    return m;
  }, [strategies]);

  /* Stats grouped by strategy_id */
  const stats = useMemo(() => {
    const raw = buildStrategyStats(trades, true);
    return raw.map((s) => {
      if (s.symbol === "__none__") {
        return { ...s, displayName: t("strategiesReport.noStrategy"), color: "var(--muted-foreground)" };
      }
      const info = strategyMap.get(s.symbol);
      return {
        ...s,
        displayName: info?.name ?? s.symbol.slice(0, 8),
        color: info?.color ?? "var(--primary)",
      };
    });
  }, [trades, strategyMap, t]);

  /* KPI cards */
  const kpis = useMemo(() => {
    const withStrategy = stats.filter((s) => s.symbol !== "__none__");
    if (withStrategy.length === 0) return null;
    const best = withStrategy.reduce((a, b) => (a.netPnl > b.netPnl ? a : b));
    const worst = withStrategy.reduce((a, b) => (a.netPnl < b.netPnl ? a : b));
    const mostActive = withStrategy.reduce((a, b) => (a.tradeCount > b.tradeCount ? a : b));
    const bestWr = withStrategy.filter((s) => s.tradeCount >= 2).reduce(
      (a, b) => (a.winRate > b.winRate ? a : b),
      withStrategy[0]
    );
    return { best, worst, mostActive, bestWr };
  }, [stats]);

  /* Chart data */
  const chartData = useMemo(
    () =>
      stats.map((s) => ({
        name: s.displayName,
        netPnl: s.netPnl,
        tradeCount: s.tradeCount,
        winRate: s.winRate,
        color: s.color,
      })),
    [stats]
  );

  const empty = trades.length === 0;
  const hasStrategies = stats.some((s) => s.symbol !== "__none__");

  return (
    <div className="space-y-6" ref={exportRef}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("strategiesReport.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("strategiesReport.descriptionFull")}</p>
        </div>
        <ExportPdfButton
          onExport={handleExport}
          isExporting={isExporting}
          canExport={canExport}
        />
      </div>

      {/* KPI Cards */}
      {!empty && kpis && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">{t("strategiesReport.bestStrategy")}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: kpis.best.color }} />
                <p className="font-semibold text-profit">{kpis.best.displayName}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.best.tradeCount} trades · {fmtPnl(kpis.best.netPnl)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">{t("strategiesReport.worstStrategy")}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: kpis.worst.color }} />
                <p className="font-semibold text-loss">{kpis.worst.displayName}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.worst.tradeCount} trades · {fmtPnl(kpis.worst.netPnl)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">{t("strategiesReport.mostActive")}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: kpis.mostActive.color }} />
                <p className="font-semibold text-foreground">{kpis.mostActive.displayName}</p>
              </div>
              <p className="text-xs text-muted-foreground">{kpis.mostActive.tradeCount} trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">{t("strategiesReport.bestWinRate")}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: kpis.bestWr.color }} />
                <p className="font-semibold text-foreground">{kpis.bestWr.displayName}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.bestWr.winRate}% / {kpis.bestWr.tradeCount} trades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty states */}
      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">{t("strategiesReport.noTradesFilter")}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {!empty && stats.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Net P&L per strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Net P&L {t("strategiesReport.strategy").toLowerCase()}
                <WidgetTooltip text="Lucro e prejuízo líquido por estratégia." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      stroke="var(--border)"
                      interval={0}
                      angle={chartData.length > 4 ? -25 : 0}
                      textAnchor={chartData.length > 4 ? "end" : "middle"}
                      height={chartData.length > 4 ? 60 : 30}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number) => [fmtPnl(value), "Net P&L"]}
                    />
                    <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win % per strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Win % {t("strategiesReport.strategy").toLowerCase()}
                <WidgetTooltip text="Taxa de vitória por estratégia." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      stroke="var(--border)"
                      interval={0}
                      angle={chartData.length > 4 ? -25 : 0}
                      textAnchor={chartData.length > 4 ? "end" : "middle"}
                      height={chartData.length > 4 ? 60 : 30}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number) => [`${value}%`, "Win %"]}
                    />
                    <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Table */}
      {!empty && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("strategiesReport.summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">{t("strategiesReport.strategy")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.winPct")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.netPnl")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.trades")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.avgVol")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.avgWin")}</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategiesReport.avgLoss")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.symbol} className="border-b border-border/50">
                      <td className="py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          {s.displayName}
                        </div>
                      </td>
                      <td className="py-2 text-right">{s.winRate}%</td>
                      <td className={cn("py-2 text-right font-medium", s.netPnl >= 0 ? "text-profit" : "text-loss")}>
                        {fmtPnl(s.netPnl)}
                      </td>
                      <td className="py-2 text-right">{s.tradeCount}</td>
                      <td className="py-2 text-right">{s.avgDailyVolume.toFixed(2)}</td>
                      <td className="py-2 text-right text-profit">{fmtPnl(s.avgWin)}</td>
                      <td className="py-2 text-right text-loss">{fmtPnl(s.avgLoss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No strategies assigned yet */}
      {!empty && !hasStrategies && (
        <Card>
          <CardContent className="flex min-h-[120px] flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">{t("strategiesReport.noStrategiesYet")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
