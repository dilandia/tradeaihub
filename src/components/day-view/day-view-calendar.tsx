"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNames, getWeekdayNames } from "@/lib/i18n/date-utils";
import type { CalendarTrade } from "@/lib/calendar-utils";

type Props = {
  trades: CalendarTrade[];
  year: number;
  month: number;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
};

export function DayViewCalendar({
  trades,
  year,
  month,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: Props) {
  const { locale } = useLanguage();
  const monthNames = useMemo(() => getMonthNames(locale), [locale]);
  const weekdays = useMemo(() => getWeekdayNames(locale, "short"), [locale]);

  /* Agrupa P&L por dia */
  const dayPnl = useMemo(() => {
    const map = new Map<string, number>();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    for (const t of trades) {
      if (!t.date.startsWith(prefix)) continue;
      map.set(t.date, (map.get(t.date) ?? 0) + (t.profit_dollar ?? t.pips));
    }
    return map;
  }, [trades, year, month]);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

  function handlePrev() {
    onMonthChange(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
  }
  function handleNext() {
    onMonthChange(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-foreground">
          {monthNames[month - 1]} {year}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((wd, i) => (
          <span key={`wd-${i}`} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {wd}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) return <div key={`pad-${i}`} className="h-8" />;

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const pnl = dayPnl.get(dateStr);
          const hasTrades = pnl !== undefined;
          const isPositive = hasTrades && pnl > 0;
          const isNegative = hasTrades && pnl < 0;
          const isBreakeven = hasTrades && pnl === 0;
          const isSelected = dateStr === selectedDate;
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => hasTrades && onDateSelect(dateStr)}
              disabled={!hasTrades}
              className={cn(
                "relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all",
                /* Cores de fundo e texto por resultado do dia */
                isPositive && "bg-profit/20 text-profit border border-profit/40",
                isNegative && "bg-loss/20 text-loss border border-loss/40",
                isBreakeven && "bg-muted text-muted-foreground border border-border",
                /* Sem trades */
                !hasTrades && "text-muted-foreground/60 cursor-default",
                /* Hoje */
                isToday && !hasTrades && "border border-score/50 text-foreground",
                /* Selecionado */
                isSelected && "ring-2 ring-offset-1 ring-offset-card ring-score",
                /* Hover apenas em dias com trades */
                hasTrades && "cursor-pointer hover:scale-110 hover:shadow-md",
              )}
              style={
                isPositive
                  ? { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.4)" }
                  : isNegative
                  ? { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)" }
                  : undefined
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
