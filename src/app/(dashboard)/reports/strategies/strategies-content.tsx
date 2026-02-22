"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { computeClientMetrics } from "@/lib/dashboard-calc";
import { buildAccountBalance } from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";

type Props = { trades: CalendarTrade[] };

function fmtPnl(v: number): string {
  return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function StrategiesContent({ trades }: Props) {
  const { t } = useLanguage();
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Strategies-Report");
  const metrics = useMemo(() => computeClientMetrics(trades), [trades]);
  const cumulativeData = useMemo(
    () => buildAccountBalance(trades, true),
    [trades]
  );

  const empty = trades.length === 0;

  return (
    <div className="space-y-6" ref={exportRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("strategies.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("strategies.description")}
          </p>
        </div>
        <ExportPdfButton
          onExport={handleExport}
          isExporting={isExporting}
          canExport={canExport}
        />
      </div>

      {empty && (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              {t("strategies.noTradesFilter")}
            </p>
          </CardContent>
        </Card>
      )}

      {!empty && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                {t("strategies.summary")}
                <WidgetTooltip text={t("strategies.summaryTooltip")} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">{t("strategies.strategy")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.winPct")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.netPnl")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.trades")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.avgVol")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.avgWin")}</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">{t("strategies.avgLoss")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium">{t("strategies.none")}</td>
                      <td className="py-2 text-right">{metrics.winRate}%</td>
                      <td
                        className={cn(
                          "py-2 text-right font-medium",
                          metrics.netDollar >= 0 ? "text-profit" : "text-loss"
                        )}
                      >
                        {fmtPnl(metrics.netDollar)}
                      </td>
                      <td className="py-2 text-right">{metrics.totalTrades}</td>
                      <td className="py-2 text-right">
                        {metrics.totalTrades > 0
                          ? (
                              metrics.totalTrades /
                              new Set(trades.map((t) => t.date)).size
                            ).toFixed(2)
                          : "0"}
                      </td>
                      <td className="py-2 text-right text-profit">
                        {fmtPnl(metrics.avgWinDollar)}
                      </td>
                      <td className="py-2 text-right text-loss">
                        {fmtPnl(metrics.avgLossDollar)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {cumulativeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                  Daily Net Cumulative P&L
                  <WidgetTooltip text="Evolução do P&L acumulado ao longo do tempo." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={cumulativeData.map((d) => ({ ...d, cumulative: d.balance }))}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
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
                        formatter={(value: number) => [fmtPnl(value), "P&L"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--profit)"
                        fill="url(#stratGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
