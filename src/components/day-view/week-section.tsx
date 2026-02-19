"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { CalendarTrade } from "@/lib/calendar-utils";
import { DayCard } from "./day-card";
import type { ColumnKey } from "./column-selector";

function fmtMoney(val: number): string {
  const abs = Math.abs(val);
  if (val >= 0) return `$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `-$${abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Props = {
  weekNum: number;
  weekLabel: string;
  days: [string, CalendarTrade[]][];
  expandedDays: Set<string>;
  onToggleDay: (date: string) => void;
  columns: ColumnKey[];
  expandedWeeks: Set<number>;
  onToggleWeek: (week: number) => void;
};

export function WeekSection({
  weekNum,
  weekLabel,
  days,
  expandedDays,
  onToggleDay,
  columns,
  expandedWeeks,
  onToggleWeek,
}: Props) {
  const { t } = useLanguage();

  const weekStats = useMemo(() => {
    let totalPnl = 0;
    let totalTrades = 0;
    let wins = 0;
    for (const [, dayTrades] of days) {
      for (const tr of dayTrades) {
        totalPnl += tr.profit_dollar ?? tr.pips;
        totalTrades++;
        if (tr.is_win) wins++;
      }
    }
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    return { totalPnl, totalTrades, winRate };
  }, [days]);

  const isExpanded = expandedWeeks.has(weekNum);

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      {/* Week header */}
      <button
        type="button"
        onClick={() => onToggleWeek(weekNum)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-bold text-foreground">{weekLabel}</span>
        <span className={cn("text-sm font-semibold", weekStats.totalPnl >= 0 ? "text-profit" : "text-loss")}>
          {fmtMoney(weekStats.totalPnl)}
        </span>
        <span className="text-xs text-muted-foreground">
          {weekStats.totalTrades} {t("strategies.trades")} · {weekStats.winRate.toFixed(0)}% win
        </span>
      </button>

      {/* Days in week */}
      {isExpanded && (
        <div className="border-t border-border bg-background/50 space-y-2 px-3 py-3">
          {days.map(([date, dayTrades]) => (
            <div key={date} id={`day-${date}`}>
              <DayCard
                date={date}
                trades={dayTrades}
                expanded={expandedDays.has(date)}
                onToggle={() => onToggleDay(date)}
                columns={columns}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
