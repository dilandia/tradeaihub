"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { formatDateShort } from "@/lib/i18n/date-utils";
import type { CalendarTrade } from "@/lib/calendar-utils";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { DayTradesTable } from "./day-trades-table";
import type { ColumnKey } from "./column-selector";

type Props = {
  date: string;
  trades: CalendarTrade[];
  expanded: boolean;
  onToggle: () => void;
  columns: ColumnKey[];
};

function fmtMoney(val: number): string {
  const abs = Math.abs(val);
  if (val >= 0) return `$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `-$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DayCard({ date, trades, expanded, onToggle, columns }: Props) {
  const { locale, t } = useLanguage();
  const metrics = useMemo(() => {
    const wins = trades.filter((t) => t.is_win);
    const losses = trades.filter((t) => !t.is_win);
    const grossPnl = trades.reduce((s, t) => s + (t.profit_dollar ?? t.pips), 0);
    const grossProfit = wins.reduce((s, t) => s + Math.abs(t.profit_dollar ?? t.pips), 0);
    const grossLoss = losses.reduce((s, t) => s + Math.abs(t.profit_dollar ?? t.pips), 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0;

    return {
      totalTrades: trades.length,
      grossPnl,
      winRate,
      wins: wins.length,
      losses: losses.length,
      profitFactor,
      grossProfit,
    };
  }, [trades]);

  /* Mini chart: cumulative P&L intraday */
  const miniChartData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      const ta = a.entry_time ?? a.time ?? "";
      const tb = b.entry_time ?? b.time ?? "";
      return ta.localeCompare(tb);
    });
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.profit_dollar ?? t.pips;
      return { idx: i, pnl: Math.round(cum * 100) / 100 };
    });
  }, [trades]);

  const isPositive = metrics.grossPnl >= 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {expanded
          ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
        <span className="text-sm font-semibold text-foreground">{formatDateShort(date, locale)}</span>
        <span className={cn("text-sm font-bold", isPositive ? "text-profit" : "text-loss")}>
          {t("dayView.netPnl")} {fmtMoney(metrics.grossPnl)}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); }}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            + {t("dayView.addNote")}
          </button>
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Stats bar with mini chart */}
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start">
            {/* Mini chart */}
            <div className="h-20 w-full sm:h-24 sm:w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id={`dayGrad-${date}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["auto", "auto"]} hide />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke={isPositive ? "#10B981" : "#EF4444"}
                    strokeWidth={1.5}
                    fill={`url(#dayGrad-${date})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key metrics */}
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <MetricItem label="Total Trades" value={String(metrics.totalTrades)} />
              <MetricItem
                label="Gross P&L"
                value={fmtMoney(metrics.grossPnl)}
                color={isPositive ? "text-profit" : "text-loss"}
              />
              <MetricItem
                label="Winners / Losers"
                value={`${metrics.wins} / ${metrics.losses}`}
                color={metrics.wins >= metrics.losses ? "text-profit" : "text-loss"}
              />
              <MetricItem label="Commissions" value="$0" />
              <MetricItem label="Win Rate" value={`${metrics.winRate.toFixed(2)}%`} />
              <MetricItem label="Volume" value={String(metrics.totalTrades)} />
              <MetricItem
                label="Profit Factor"
                value={metrics.profitFactor >= 99 ? "∞" : metrics.profitFactor.toFixed(2)}
              />
            </div>
          </div>

          {/* Trades table */}
          <div className="border-t border-border px-4 py-3">
            <DayTradesTable trades={trades} columns={columns} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", color ?? "text-foreground")}>{value}</span>
    </div>
  );
}
