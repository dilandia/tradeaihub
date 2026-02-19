"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNames, getWeekdayNames } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";
import type { DayCell, WeekSummary } from "@/lib/calendar-utils";

type CalendarHeatmapProps = {
  year: number;
  month: number;
  days: DayCell[];
  weeks: WeekSummary[];
  monthPnl: number;
  monthTrades: number;
  monthTradingDays: number;
  privacy?: boolean;
  unit?: string;
  onMonthChange?: (year: number, month: number) => void;
  onDayClick?: (date: string, dayData: DayCell | null) => void;
};

function fmtPnl(val: number, unit: string): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? "" : "-";
  if (unit === "$") {
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
    return `${sign}$${abs.toFixed(2)}`;
  }
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${abs.toFixed(val % 1 === 0 ? 0 : 1)}`;
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { startPad: first.getDay(), daysInMonth: last.getDate() };
}

export function CalendarHeatmap({
  year,
  month,
  days,
  weeks,
  monthPnl,
  monthTrades,
  monthTradingDays,
  privacy = false,
  unit = "pips",
  onMonthChange,
  onDayClick,
}: CalendarHeatmapProps) {
  const { locale } = useLanguage();
  const monthNames = useMemo(() => getMonthNames(locale), [locale]);
  const weekdays = useMemo(() => getWeekdayNames(locale, "short"), [locale]);
  const { startPad, daysInMonth } = getDaysInMonth(year, month);
  const mapByDate = new Map(days.map((d) => [d.date, d]));

  type CellData = { day: number; dateStr: string; data: DayCell | null };
  const cells: (CellData | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, data: mapByDate.get(dateStr) ?? null });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weekRows: (CellData | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weekRows.push(cells.slice(i, i + 7));
  }

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

  function handleThisMonth() {
    const now = new Date();
    onMonthChange?.(now.getFullYear(), now.getMonth() + 1);
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="h-full p-0">
        <div className="flex h-full">
          {/* Calendar Grid */}
          <div className="flex flex-1 min-w-0 flex-col p-3 sm:p-4">
            {/* Header — compacto */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  {monthNames[month - 1]} {year}
                </h3>
                <WidgetTooltip text="Visão mensal dos seus trades por dia, com P&L, quantidade e taxa de acerto de cada dia." />
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleThisMonth}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Este mês
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Mensal:{" "}
                  <span className={cn("font-semibold", monthPnl >= 0 ? "text-profit" : "text-loss")}>
                    {privacy ? "•••" : fmtPnl(monthPnl, unit)}
                  </span>
                  {" "}{monthTradingDays} dias {" "}{monthTrades} trades
                </span>
              </div>
            </div>

            {/* Weekday headers — compacto */}
            <div className="grid grid-cols-7 gap-0.5 pb-0.5">
              {weekdays.map((d, i) => (
                <div key={`wd-${i}`} className="text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells — compacto estilo TradeZella, linhas preenchem espaço */}
            <div
              className="grid flex-1 grid-cols-7 gap-0.5 sm:gap-1"
              style={{ gridAutoRows: "minmax(2.25rem, 1fr)" }}
            >
              {cells.map((cell, i) => {
                if (!cell) {
                  return <div key={`pad-${i}`} />;
                }

                const d = cell.data;
                const hasTrades = d != null && d.tradesCount > 0;
                const isProfit = hasTrades && d.pnl > 0;
                const isLoss = hasTrades && d.pnl < 0;
                const isBreakeven = hasTrades && d.pnl === 0;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => onDayClick?.(cell.dateStr, d)}
                    className={cn(
                      "relative flex h-full min-w-0 flex-col items-center justify-center rounded border p-1 sm:rounded-md sm:p-1.5 text-center transition-all",
                      "hover:ring-2 hover:ring-score/40 focus:outline-none focus:ring-2 focus:ring-score",
                      isProfit && "border-profit/40 bg-profit/15",
                      isLoss && "border-loss/40 bg-loss/15",
                      isBreakeven && "border-score/40 bg-score/15",
                      !hasTrades && "border-border/50 bg-muted/15"
                    )}
                  >
                    <span className="absolute right-1 top-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                      {cell.day}
                    </span>

                    {hasTrades ? (
                      <div className="flex flex-col items-center justify-center gap-px leading-tight">
                        <span
                          className={cn(
                            "text-[11px] font-bold sm:text-xs",
                            isProfit ? "text-profit" : isLoss ? "text-loss" : "text-muted-foreground"
                          )}
                        >
                          {privacy ? "•••" : fmtPnl(d.pnl, unit)}
                        </span>
                        <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                          {d.tradesCount}T - {d.winRate}%
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly Sidebar — compacto */}
          <div className="hidden w-20 shrink-0 flex-col border-l border-border lg:flex">
            {weekRows.map((_, wi) => {
              const week = weeks[wi];
              if (!week) return null;
              const hasActivity = week.tradingDays > 0;
              return (
                <div
                  key={week.weekNum}
                  className="flex flex-1 min-h-0 flex-col items-center justify-center gap-0 border-b border-border/50 px-1.5 py-1 last:border-b-0"
                >
                  <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                    Semana {week.weekNum}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold sm:text-sm",
                      !hasActivity
                        ? "text-muted-foreground"
                        : week.pnl >= 0
                          ? "text-profit"
                          : "text-loss"
                    )}
                  >
                    {privacy ? "•••" : hasActivity ? fmtPnl(week.pnl, unit) : (unit === "$" ? "$0" : "0")}
                  </span>
                  <span className="text-[9px] text-muted-foreground sm:text-[10px]">
                    {week.tradingDays} dia{week.tradingDays !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
