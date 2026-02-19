"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNames, getWeekdayNames } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";
import type { DayCell } from "@/lib/calendar-utils";

function fmtPnl(val: number, unit: string): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? "" : "-";
  if (unit === "$") {
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { startPad: first.getDay(), daysInMonth: last.getDate() };
}

type CalendarMiniProps = {
  year: number;
  month: number;
  days: DayCell[];
  monthPnl: number;
  monthTrades: number;
  monthTradingDays: number;
  privacy?: boolean;
  unit?: string;
  onMonthChange?: (year: number, month: number) => void;
  onDayClick?: (date: string, dayData: DayCell | null) => void;
};

export function CalendarMini({
  year,
  month,
  days,
  monthPnl,
  monthTrades,
  monthTradingDays,
  privacy = false,
  unit = "pips",
  onMonthChange,
  onDayClick,
}: CalendarMiniProps) {
  const { locale } = useLanguage();
  const monthNames = useMemo(() => getMonthNames(locale), [locale]);
  const weekdays = useMemo(() => getWeekdayNames(locale, "narrow"), [locale]);
  const { startPad, daysInMonth } = getDaysInMonth(year, month);
  const mapByDate = new Map(days.map((d) => [d.date, d]));

  const cells: { day: number; dateStr: string; data: DayCell | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: 0, dateStr: "", data: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, data: mapByDate.get(dateStr) ?? null });
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, dateStr: "", data: null });

  function handlePrev() {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    onMonthChange?.(y, m);
  }

  function handleNext() {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    onMonthChange?.(y, m);
  }

  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col p-3 justify-center">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <h3 className="text-xs font-semibold text-foreground">
              {monthNames[month - 1]} {year}
            </h3>
            <WidgetTooltip text="Calendário compacto do mês com P&L por dia." />
            <button
              type="button"
              onClick={handleNext}
              className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className={cn("font-medium", monthPnl >= 0 ? "text-profit" : "text-loss")}>
              {privacy ? "•••" : fmtPnl(monthPnl, unit)}
            </span>
            <span>{monthTradingDays}d</span>
            <span>{monthTrades}T</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-[9px]">
          {weekdays.map((d, i) => (
            <div key={`wd-${i}`} className="pb-0.5 text-center font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell.day === 0) {
              return <div key={`pad-${i}`} className="aspect-square" />;
            }
            const d = cell.data;
            const hasTrades = d != null && d.tradesCount > 0;
            const isProfit = hasTrades && d.pnl > 0;
            const isLoss = hasTrades && d.pnl < 0;

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onDayClick?.(cell.dateStr, d)}
                className={cn(
                  "flex aspect-square min-w-0 items-center justify-center rounded border p-0.5 text-center transition-all",
                  "hover:ring-1 hover:ring-score/40 focus:outline-none focus:ring-1 focus:ring-score",
                  isProfit && "border-profit/40 bg-profit/10",
                  isLoss && "border-loss/40 bg-loss/10",
                  !hasTrades && "border-transparent bg-muted/20"
                )}
              >
                {hasTrades ? (
                  <span
                    className={cn(
                      "truncate font-medium",
                      isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                    )}
                  >
                    {privacy ? "•" : fmtPnl(d.pnl, unit)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">{cell.day}</span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
