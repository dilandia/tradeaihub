"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import {
  buildPerformanceMetrics,
  buildAccountBalance,
  buildAvgDailyWinLossRatio,
  computeRadarMetrics,
} from "@/lib/dashboard-calc";
import type { CalendarTrade } from "@/lib/calendar-utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { ChevronDown } from "lucide-react";
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

function fmtDuration(mins: number): string {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h < 24) return `${h}h ${String(m).padStart(2, "0")}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h ${String(m).padStart(2, "0")}m`;
}

function KpiCell({
  label,
  value,
  positive,
  tooltip,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {tooltip && <WidgetTooltip text={tooltip} />}
      </div>
      <span
        className={cn(
          "font-semibold",
          positive === true && "text-profit",
          positive === false && "text-loss"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PerformanceContent({ trades }: Props) {
  const [pnlMode, setPnlMode] = useState<"net" | "gross">("net");
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Performance-Report");

  const useDollar = true;
  const metrics = useMemo(
    () => buildPerformanceMetrics(trades, useDollar),
    [trades]
  );
  const cumulativeData = useMemo(
    () => buildAccountBalance(trades, useDollar),
    [trades]
  );
  const avgDailyWinLossData = useMemo(
    () => buildAvgDailyWinLossRatio(trades, useDollar),
    [trades]
  );
  const radarMetrics = useMemo(
    () => computeRadarMetrics(trades, useDollar),
    [trades]
  );

  const empty = trades.length === 0;

  return (
    <div className="space-y-6" ref={exportRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu desempenho de trading.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={pnlMode}
              onChange={(e) => setPnlMode(e.target.value as "net" | "gross")}
              className="rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm"
            >
              <option value="net">NET P&L</option>
              <option value="gross">GROSS P&L</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <ExportPdfButton
            onExport={handleExport}
            isExporting={isExporting}
            canExport={canExport}
          />
        </div>
      </div>

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
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                  Net P&L - cumulative
                  <WidgetTooltip text="Evolução do P&L acumulado ao longo do tempo." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
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
                        formatter={(value: number) => [fmtPnl(value), "Net P&L"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--profit)"
                        fill="url(#perfGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                  Avg daily win/loss
                  <WidgetTooltip text="Razão média diária de ganhos vs perdas." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avgDailyWinLossData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        stroke="var(--border)"
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        stroke="var(--border)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value: number) => [value.toFixed(2), "Ratio"]}
                      />
                      <Bar
                        dataKey="ratio"
                        fill="var(--profit)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* SUMMARY */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCell label="Net P&L" value={fmtPnl(metrics.netPnl)} positive={metrics.netPnl >= 0} tooltip="Lucro ou prejuízo líquido total." />
                  <KpiCell label="Win %" value={`${metrics.winRate}%`} tooltip="Porcentagem de trades vencedores." />
                  <KpiCell
                    label="Avg daily win %"
                    value={`${metrics.avgDailyWinPct}% (${metrics.winDays}/${metrics.lossDays}/${metrics.breakevenDays})`}
                    tooltip="Porcentagem de dias vencedores. Formato: ganhadores/perdedores/breakeven."
                  />
                  <KpiCell label="Profit factor" value={metrics.profitFactor.toFixed(2)} tooltip="Razão entre lucro bruto e perda bruta." />
                  <KpiCell label="Trade expectancy" value={fmtPnl(metrics.tradeExpectancy)} tooltip="Expectativa média por trade." />
                  <KpiCell label="Avg daily win/loss" value={metrics.avgDailyWinLoss.toFixed(2)} tooltip="Razão média de ganho/perda por dia." />
                  <KpiCell label="Avg trade win/loss" value={metrics.avgTradeWinLoss.toFixed(2)} tooltip="Razão entre ganho médio e perda média por trade." />
                  <KpiCell label="Avg hold time" value={fmtDuration(metrics.avgHoldTimeMinutes)} tooltip="Tempo médio de permanência na posição." />
                  <KpiCell label="Avg net trade P&L" value={fmtPnl(metrics.avgNetTradePnl)} positive={metrics.avgNetTradePnl >= 0} tooltip="P&L médio por trade." />
                  <KpiCell label="Avg daily net P&L" value={fmtPnl(metrics.avgDailyNetPnl)} positive={metrics.avgDailyNetPnl >= 0} tooltip="P&L líquido médio por dia." />
                  <KpiCell label="Avg. planned r-multiple" value={metrics.avgPlannedRMultiple != null ? `${metrics.avgPlannedRMultiple}R` : "N/A"} tooltip="Múltiplo R planejado médio." />
                  <KpiCell label="Avg. realized r-multiple" value={metrics.avgRealizedRMultiple != null ? `${metrics.avgRealizedRMultiple}R` : "N/A"} tooltip="Múltiplo R realizado médio." />
                  <KpiCell label="Avg daily volume" value={metrics.avgDailyVolume.toFixed(2)} tooltip="Média de trades por dia." />
                  <KpiCell label="Logged days" value={metrics.loggedDays} tooltip="Dias com registro de journal." />
                  <KpiCell label="Max daily net drawdown" value={fmtPnl(metrics.maxDailyDrawdown)} positive={false} tooltip="Maior drawdown diário." />
                  <KpiCell label="Avg daily net drawdown" value={fmtPnl(metrics.avgDailyDrawdown)} positive={false} tooltip="Drawdown diário médio." />
                </div>
              </CardContent>
            </Card>

            {/* DAYS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCell label="Avg daily win %" value={`${metrics.avgDailyWinPct}% (${metrics.winDays}/${metrics.lossDays}/${metrics.breakevenDays})`} tooltip="Porcentagem de dias vencedores." />
                  <KpiCell label="Largest losing day" value={fmtPnl(metrics.largestLosingDay)} positive={false} tooltip="Maior perda em um único dia." />
                  <KpiCell label="Avg daily win/loss" value={metrics.avgDailyWinLoss.toFixed(2)} tooltip="Razão média de ganho/perda por dia." />
                  <KpiCell label="Average trading days duration" value={fmtDuration(metrics.avgTradingDaysDurationMinutes)} tooltip="Duração média dos dias de trading." />
                  <KpiCell label="Largest profitable day" value={fmtPnl(metrics.largestProfitableDay)} positive={true} tooltip="Maior lucro em um único dia." />
                  <KpiCell label="Avg Takerz Scale" value={`${Math.round((radarMetrics.winRate + radarMetrics.profitFactor + radarMetrics.avgWinLoss) / 3)}%`} tooltip="Média de métricas do Takerz Score." />
                  <KpiCell label="Avg daily net P&L" value={fmtPnl(metrics.avgDailyNetPnl)} positive={metrics.avgDailyNetPnl >= 0} tooltip="P&L líquido médio por dia." />
                </div>
              </CardContent>
            </Card>

            {/* TRADES */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCell label="Win %" value={`${metrics.winRate}%`} tooltip="Porcentagem de trades vencedores." />
                  <KpiCell label="Avg trade win/loss" value={metrics.avgTradeWinLoss.toFixed(2)} tooltip="Razão entre ganho médio e perda média por trade." />
                  <KpiCell label="Largest profitable trade" value={fmtPnl(metrics.largestProfitableTrade)} positive={true} tooltip="Maior trade lucrativo." />
                  <KpiCell label="Longest trade duration" value={metrics.longestTradeDurationMinutes != null ? fmtDuration(metrics.longestTradeDurationMinutes) : "N/A"} tooltip="Duração do trade mais longo." />
                  <KpiCell label="Longs win %" value={metrics.longsWinPct != null ? `${metrics.longsWinPct}%` : "N/A"} tooltip="Porcentagem de vitórias em operações long." />
                  <KpiCell label="Trade expectancy" value={fmtPnl(metrics.tradeExpectancy)} tooltip="Expectativa média por trade." />
                  <KpiCell label="Largest losing trade" value={fmtPnl(-metrics.largestLosingTrade)} positive={false} tooltip="Maior trade perdedor." />
                  <KpiCell label="Shorts win %" value={metrics.shortsWinPct != null ? `${metrics.shortsWinPct}%` : "N/A"} tooltip="Porcentagem de vitórias em operações short." />
                  <KpiCell label="Avg net trade P&L" value={fmtPnl(metrics.avgNetTradePnl)} positive={metrics.avgNetTradePnl >= 0} tooltip="P&L médio por trade." />
                  <KpiCell label="Average trading days duration" value={fmtDuration(metrics.avgTradingDaysDurationMinutes)} tooltip="Duração média dos dias de trading." />
                  <KpiCell label="Avg Takerz Scale" value={`${Math.round((radarMetrics.winRate + radarMetrics.profitFactor + radarMetrics.avgWinLoss) / 3)}%`} tooltip="Média de métricas do Takerz Score." />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
