"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AiAgentCard } from "@/components/ai/ai-agent-card";
import { fetchAiReportSummary } from "@/hooks/use-ai-api";
import { useLanguage } from "@/contexts/language-context";
import type { CalendarTrade } from "@/lib/calendar-utils";
import {
  buildPerformanceMetrics,
  buildAccountBalance,
  buildNetDailyPnl,
} from "@/lib/dashboard-calc";
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
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

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

function StatRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-medium",
          positive === true && "text-profit",
          positive === false && "text-loss"
        )}
      >
        {value}
      </span>
    </div>
  );
}

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export function OverviewContent({ trades }: Props) {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const importId = searchParams.get("import") ?? undefined;
  const accountId = searchParams.get("account") ?? undefined;
  const period = searchParams.get("period") ?? "all";
  const useDollar = true;
  const metrics = useMemo(
    () => buildPerformanceMetrics(trades, useDollar),
    [trades]
  );
  const cumulativeData = useMemo(
    () => buildAccountBalance(trades, useDollar),
    [trades]
  );
  const dailyPnlData = useMemo(
    () => buildNetDailyPnl(trades, useDollar),
    [trades]
  );

  const empty = trades.length === 0;

  /* Best / Worst / Avg month */
  const byMonth = new Map<string, number>();
  for (const t of trades) {
    const key = t.date.slice(0, 7);
    const val = t.profit_dollar != null ? t.profit_dollar : t.pips;
    byMonth.set(key, (byMonth.get(key) ?? 0) + val);
  }
  const sortedMonths = Array.from(byMonth.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const bestMonth =
    sortedMonths.reduce((a, b) => (a[1] > b[1] ? a : b), sortedMonths[0] ?? ["", 0]);
  const worstMonth =
    sortedMonths.reduce((a, b) => (a[1] < b[1] ? a : b), sortedMonths[0] ?? ["", 0]);
  const avgMonthly =
    sortedMonths.length > 0
      ? sortedMonths.reduce((s, [, v]) => s + v, 0) / sortedMonths.length
      : 0;

  const monthName = (key: string) => {
    const [, m] = key.split("-");
    const monthKey = MONTH_KEYS[parseInt(m, 10) - 1];
    return `${t(`months.${monthKey}`)} ${key.slice(0, 4)}`;
  };

  if (empty) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">{t("overview.title")}</h1>
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              {t("overview.noTradesFilter")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("overview.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("overview.description")}
      </p>

      {/* AI Report Summary */}
      <AiAgentCard
        title={t("overview.aiCardTitle")}
        description={t("overview.aiCardDesc")}
        onGenerate={() =>
          fetchAiReportSummary({
            importId,
            accountId,
            period,
            locale,
          })
        }
        loadingMessageKeys={["common.aiGeneratingInsights", "common.aiAnalyzing", "common.aiIdentifyingTrends"]}
      />

      {/* Top 3: Best / Lowest / Average month */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t("overview.bestMonth")}</p>
            <p
              className={cn(
                "font-semibold",
                bestMonth[1] >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {fmtPnl(bestMonth[1])}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("overview.in")} {monthName(bestMonth[0])}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t("overview.worstMonth")}</p>
            <p
              className={cn(
                "font-semibold",
                worstMonth[1] >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {fmtPnl(worstMonth[1])}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("overview.in")} {monthName(worstMonth[0])}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t("overview.avgPerMonth")}</p>
            <p
              className={cn(
                "font-semibold",
                avgMonthly >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {fmtPnl(avgMonthly)}
            </p>
            <p className="text-xs text-muted-foreground">{t("overview.perMonth")}</p>
          </CardContent>
        </Card>
      </div>

      {/* YOUR STATS (ALL DATES) - 2 columns like Tradezella */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">{t("overview.yourStats")}</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Coluna 1 */}
            <div className="space-y-0">
              <StatRow label={t("overview.totalPnl")} value={fmtPnl(metrics.netPnl)} positive={metrics.netPnl >= 0} />
              <StatRow label={t("overview.avgDailyVolume")} value={metrics.avgDailyVolume.toFixed(2)} />
              <StatRow
                label={t("overview.avgWinningTrade")}
                value={fmtPnl(metrics.avgWinDollar)}
                positive
              />
              <StatRow
                label={t("overview.avgLosingTrade")}
                value={fmtPnl(-metrics.avgLossDollar)}
                positive={false}
              />
              <StatRow label={t("overview.totalTrades")} value={metrics.totalTrades} />
              <StatRow label={t("overview.winningTrades")} value={metrics.wins} />
              <StatRow label={t("overview.losingTrades")} value={metrics.losses} />
              <StatRow label={t("overview.breakEvenTrades")} value={metrics.breakEvenTrades} />
              <StatRow label={t("overview.maxConsecutiveWins")} value={metrics.maxConsecutiveWins} />
              <StatRow label={t("overview.maxConsecutiveLosses")} value={metrics.maxConsecutiveLosses} />
              <StatRow label={t("overview.totalCommissions")} value="$0" />
              <StatRow label={t("overview.totalFees")} value="$0" />
              <StatRow label={t("overview.totalSwap")} value="$0" />
              <StatRow label={t("overview.largestProfit")} value={fmtPnl(metrics.largestProfitableTrade)} positive />
              <StatRow label={t("overview.largestLoss")} value={fmtPnl(-metrics.largestLosingTrade)} positive={false} />
              <StatRow
                label={t("overview.avgHoldTimeAll")}
                value={metrics.avgHoldTimeMinutes > 0 ? fmtDuration(metrics.avgHoldTimeMinutes) : t("na")}
              />
              <StatRow
                label={t("overview.avgHoldTimeWinners")}
                value={metrics.avgHoldTimeWinningMinutes != null ? fmtDuration(metrics.avgHoldTimeWinningMinutes) : t("na")}
              />
              <StatRow
                label={t("overview.avgHoldTimeLosers")}
                value={metrics.avgHoldTimeLosingMinutes != null ? fmtDuration(metrics.avgHoldTimeLosingMinutes) : t("na")}
              />
              <StatRow
                label={t("overview.avgHoldTimeScratch")}
                value={metrics.avgHoldTimeScratchMinutes != null ? fmtDuration(metrics.avgHoldTimeScratchMinutes) : t("na")}
              />
              <StatRow label={t("overview.avgTradePnl")} value={fmtPnl(metrics.avgNetTradePnl)} positive={metrics.avgNetTradePnl >= 0} />
              <StatRow label={t("overview.profitFactor")} value={metrics.profitFactor.toFixed(2)} />
            </div>

            {/* Coluna 2 */}
            <div className="space-y-0">
              <StatRow label={t("overview.openTrades")} value="0" />
              <StatRow label={t("overview.tradingDays")} value={metrics.totalDays} />
              <StatRow label={t("overview.winningDays")} value={metrics.winDays} />
              <StatRow label={t("overview.losingDays")} value={metrics.lossDays} />
              <StatRow label={t("overview.breakevenDays")} value={metrics.breakevenDays} />
              <StatRow label={t("overview.loggedDays")} value={metrics.loggedDays} />
              <StatRow label={t("overview.maxConsecutiveWinningDays")} value={metrics.maxConsecutiveWinningDays} />
              <StatRow label={t("overview.maxConsecutiveLosingDays")} value={metrics.maxConsecutiveLosingDays} />
              <StatRow label={t("overview.avgDailyPnl")} value={fmtPnl(metrics.avgDailyNetPnl)} positive={metrics.avgDailyNetPnl >= 0} />
              <StatRow label={t("overview.avgWinningDayPnl")} value={fmtPnl(metrics.avgWinningDayPnl)} positive />
              <StatRow label={t("overview.avgLosingDayPnl")} value={fmtPnl(-metrics.avgLosingDayPnl)} positive={false} />
              <StatRow label={t("overview.largestProfitableDay")} value={fmtPnl(metrics.largestProfitableDay)} positive />
              <StatRow label={t("overview.largestLosingDay")} value={fmtPnl(-metrics.largestLosingDay)} positive={false} />
              <StatRow
                label={t("overview.avgPlannedRMultiple")}
                value={metrics.avgPlannedRMultiple != null ? `${metrics.avgPlannedRMultiple}R` : t("na")}
              />
              <StatRow
                label={t("overview.avgRealizedRMultiple")}
                value={metrics.avgRealizedRMultiple != null ? `${metrics.avgRealizedRMultiple}R` : t("na")}
              />
              <StatRow label={t("overview.tradeExpectancy")} value={fmtPnl(metrics.tradeExpectancy)} positive={metrics.tradeExpectancy >= 0} />
              <StatRow label={t("overview.maxDrawdown")} value={fmtPnl(metrics.maxDailyDrawdown)} positive={false} />
              <StatRow
                label={t("overview.maxDrawdownPct")}
                value={metrics.maxDrawdownPct > 0 ? `${metrics.maxDrawdownPct.toFixed(1)}%` : "—"}
              />
              <StatRow label={t("overview.avgDrawdown")} value={fmtPnl(metrics.avgDailyDrawdown)} positive={false} />
              <StatRow
                label={t("overview.avgDrawdownPct")}
                value={
                  metrics.netPnl !== 0
                    ? `${((Math.abs(metrics.avgDailyDrawdown) / Math.abs(metrics.netPnl)) * 100).toFixed(2)}%`
                    : "—"
                }
              />
            </div>

            {/* Coluna 3 - Win rate e extras */}
            <div className="space-y-0">
              <StatRow label={t("overview.winRate")} value={`${metrics.winRate}%`} />
              <StatRow label={t("overview.longsWinPct")} value={metrics.longsWinPct != null ? `${metrics.longsWinPct}%` : t("na")} />
              <StatRow label={t("overview.shortsWinPct")} value={metrics.shortsWinPct != null ? `${metrics.shortsWinPct}%` : t("na")} />
              <StatRow label={t("overview.winLossRatioTrade")} value={metrics.avgTradeWinLoss.toFixed(2)} />
              <StatRow label={t("overview.winLossRatioDay")} value={metrics.avgDailyWinLoss.toFixed(2)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 1: Daily Net Cumulative P&L */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">{t("overview.cumulativePnlChart")}</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value: number) => [fmtPnl(value), t("overview.cumulativePnl")]}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--profit)"
                  fill="url(#overviewGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Net Daily P&L */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">{t("overview.netDailyPnlChart")}</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnlData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fillOpacity={0.8}>
                  {dailyPnlData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pnl >= 0 ? "var(--profit)" : "var(--loss)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
