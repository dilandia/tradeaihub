"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { buildTagStats } from "@/lib/reports-calc";
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

export function TagsContent({ trades }: Props) {
  const { t } = useLanguage();
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Tags-Report");
  const useDollar = true;
  const stats = useMemo(() => buildTagStats(trades, useDollar), [trades]);

  const kpis = useMemo(() => {
    if (stats.length === 0) return null;
    const best = stats.reduce((a, b) => (a.netPnl > b.netPnl ? a : b));
    const worst = stats.reduce((a, b) => (a.netPnl < b.netPnl ? a : b));
    const mostActive = stats.reduce((a, b) => (a.tradeCount > b.tradeCount ? a : b));
    const bestWr = stats.filter((s) => s.tradeCount >= 2).reduce(
      (a, b) => (a.winRate > b.winRate ? a : b),
      stats[0]
    );
    return { best, worst, mostActive, bestWr };
  }, [stats]);

  const chartData = useMemo(
    () =>
      stats.map((s) => ({
        tag: s.symbol,
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
          <h1 className="text-xl font-semibold text-foreground">{t("tags.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("tags.description")}
          </p>
        </div>
        <ExportPdfButton
          onExport={handleExport}
          isExporting={isExporting}
          canExport={canExport}
        />
      </div>

      {!empty && kpis && stats.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">{t("tags.bestTag")}</span>
              </div>
              <p className="mt-1 font-semibold text-profit">{kpis.best.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.best.tradeCount} trades · {fmtPnl(kpis.best.netPnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">{t("tags.worstTag")}</span>
              </div>
              <p className="mt-1 font-semibold text-loss">{kpis.worst.symbol}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.worst.tradeCount} trades · {fmtPnl(kpis.worst.netPnl, useDollar)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">{t("tags.mostActive")}</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.mostActive.symbol}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.mostActive.tradeCount} trades
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">{t("tags.bestWinRate")}</span>
              </div>
              <p className="mt-1 font-semibold text-foreground">
                {kpis.bestWr.symbol}
              </p>
              <p className="text-xs text-muted-foreground">
                {kpis.bestWr.winRate}% / {kpis.bestWr.tradeCount} trades
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              {t("tags.noTradesFilter")}
            </p>
          </CardContent>
        </Card>
      )}

      {!empty && stats.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Net P&L por tag
                <WidgetTooltip text="Lucro e prejuízo líquido por tag." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="tag"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
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
                      formatter={(value: number) => [fmtPnl(value, useDollar), "Net P&L"]}
                    />
                    <Bar dataKey="netPnl" fill="var(--profit)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Win % por tag
                <WidgetTooltip text="Taxa de vitória por tag." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="tag"
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

      {!empty && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">Tag</th>
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

      {!empty && stats.length === 0 && (
        <Card>
          <CardContent className="flex min-h-[120px] flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhum trade com tags para exibir. Adicione tags aos trades em Day View ou Import.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
