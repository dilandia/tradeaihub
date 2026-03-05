"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNamesShort, getWeekdayNames, formatDateShort } from "@/lib/i18n/date-utils";
import { buildCalendarDataFromTrades } from "@/lib/calendar-utils";
import type { CalendarTrade, DayCell } from "@/lib/calendar-utils";
import { ChevronLeft, ChevronRight, TrendingUp, BarChart3, Target, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePdfExport } from "@/hooks/use-pdf-export";
import { useUserTimezone } from "@/hooks/use-user-timezone";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";
import { DayCard } from "@/components/day-view/day-card";
import { DEFAULT_COLUMNS } from "@/components/day-view/column-selector";
import type { ColumnKey } from "@/components/day-view/column-selector";
import { getStrategies, type Strategy } from "@/app/actions/strategies";
import { getUserTags, type UserTag } from "@/app/actions/tags";

type Props = { trades: CalendarTrade[] };

function fmtMoney(val: number): string {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 0) return `+$${formatted}`;
  return `-$${formatted}`;
}

function fmtMoneyShort(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1000) {
    const k = abs / 1000;
    const str = k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
    return val >= 0 ? `+$${str}` : `-$${str}`;
  }
  const formatted = abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return val >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

export function CalendarReportContent({ trades }: Props) {
  const { locale, t } = useLanguage();
  const userTimezone = useUserTimezone();
  const { exportRef, handleExport, isExporting, canExport } = usePdfExport("Calendar-Report");
  const monthNames = useMemo(() => getMonthNamesShort(locale), [locale]);
  const dayNames = useMemo(() => getWeekdayNames(locale, "short"), [locale]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [columns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [s, ut] = await Promise.all([getStrategies(), getUserTags()]);
      if (!cancelled) {
        setStrategies(s);
        setUserTags(ut);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const calData = useMemo(
    () => buildCalendarDataFromTrades(trades, year, month, true),
    [trades, year, month]
  );

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

  /* Build rows grouped by week for grid + week summary */
  const { rows, weekSummaryByRow } = useMemo(() => {
    const dayMap = new Map<string, DayCell>();
    for (const d of calData.days) dayMap.set(d.date, d);

    const allCells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) allCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) allCells.push(d);
    // Pad to complete last week
    while (allCells.length % 7 !== 0) allCells.push(null);

    const weekRows: (number | null)[][] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      weekRows.push(allCells.slice(i, i + 7));
    }

    const summaries: { pnl: number; trades: number; days: number; wins: number }[] = [];
    for (const row of weekRows) {
      let pnl = 0;
      let tradeCount = 0;
      let tradingDays = 0;
      let winCount = 0;
      for (const d of row) {
        if (d == null) continue;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const cell = dayMap.get(dateStr);
        if (cell && cell.tradesCount > 0) {
          pnl += cell.pnl;
          tradeCount += cell.tradesCount;
          tradingDays += 1;
          winCount += cell.wins;
        }
      }
      summaries.push({ pnl, trades: tradeCount, days: tradingDays, wins: winCount });
    }

    return { rows: weekRows, weekSummaryByRow: summaries };
  }, [calData.days, startPad, daysInMonth, year, month]);

  const dayMap = useMemo(() => {
    const m = new Map<string, DayCell>();
    for (const d of calData.days) m.set(d.date, d);
    return m;
  }, [calData.days]);

  /* Trades for selected day */
  const selectedDayTrades = useMemo(() => {
    if (!selectedDay) return [];
    return trades.filter((t) => t.date === selectedDay);
  }, [trades, selectedDay]);

  /* Monthly win rate */
  const monthWinRate = useMemo(() => {
    const totalWins = calData.days.reduce((s, d) => s + d.wins, 0);
    return calData.monthTrades > 0 ? (totalWins / calData.monthTrades) * 100 : 0;
  }, [calData]);

  /* Positive days */
  const positiveDays = useMemo(
    () => calData.days.filter((d) => d.pnl > 0).length,
    [calData.days]
  );

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }, [month]);

  const handleDayClick = useCallback((dateStr: string) => {
    const cell = dayMap.get(dateStr);
    if (!cell || cell.tradesCount === 0) return;
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
  }, [dayMap]);

  return (
    <div className="space-y-4" ref={exportRef}>
      {/* Header with month nav */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{t("reports.calendar")}</h1>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-1">
            <button type="button" onClick={prevMonth} className="rounded p-1.5 hover:bg-background transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-sm px-2 min-w-[7rem] text-center">{monthNames[month - 1]} {year}</span>
            <button type="button" onClick={nextMonth} className="rounded p-1.5 hover:bg-background transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ExportPdfButton
          onExport={handleExport}
          isExporting={isExporting}
          canExport={canExport}
        />
      </div>

      {/* Monthly Summary Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          label="Net P&L"
          value={fmtMoney(calData.monthPnl)}
          color={calData.monthPnl >= 0 ? "text-profit" : "text-loss"}
        />
        <SummaryCard
          icon={BarChart3}
          label="Total Trades"
          value={String(calData.monthTrades)}
        />
        <SummaryCard
          icon={Target}
          label="Win Rate"
          value={`${monthWinRate.toFixed(1)}%`}
          color={monthWinRate >= 50 ? "text-profit" : "text-loss"}
        />
        <SummaryCard
          icon={CalendarDays}
          label={t("dayView.tradedDays")}
          value={`${calData.monthTradingDays}`}
          sub={`${positiveDays} ${t("dayView.positiveDays").toLowerCase()}`}
        />
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="pt-4">
          {/* Weekday headers + Week column */}
          <div className="grid grid-cols-[repeat(7,1fr)_auto] gap-1 text-center text-xs">
            {dayNames.map((d, i) => (
              <div key={`wd-${i}`} className="font-medium text-muted-foreground py-1">{d}</div>
            ))}
            <div className="font-medium text-muted-foreground py-1 px-2 text-center hidden sm:block">
              {t("dayView.week")}
            </div>

            {/* Calendar rows */}
            {rows.map((row, rowIdx) => {
              const ws = weekSummaryByRow[rowIdx];
              return (
                <div key={`row-${rowIdx}`} className="col-span-full grid grid-cols-[repeat(7,1fr)_auto] gap-1">
                  {row.map((d, colIdx) => {
                    if (d == null) return <div key={`empty-${rowIdx}-${colIdx}`} className="min-h-[3.5rem] sm:min-h-[4.5rem]" />;
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const cell = dayMap.get(dateStr);
                    const hasTrades = cell != null && cell.tradesCount > 0;
                    const isSelected = selectedDay === dateStr;
                    const isToday = dateStr === todayStr;
                    const isPositive = hasTrades && cell.pnl > 0;
                    const isNegative = hasTrades && cell.pnl < 0;

                    return (
                      <button
                        key={`day-${d}`}
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        disabled={!hasTrades}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg min-h-[3.5rem] sm:min-h-[4.5rem] px-1 py-1.5 transition-all text-center",
                          hasTrades && "cursor-pointer hover:ring-1 hover:ring-foreground/20 hover:shadow-sm",
                          !hasTrades && "cursor-default",
                          isPositive && "bg-profit/10",
                          isNegative && "bg-loss/10",
                          isSelected && "ring-2 ring-primary bg-primary/5",
                          isToday && !isSelected && "ring-1 ring-primary/40",
                        )}
                      >
                        <span className={cn(
                          "text-xs font-medium",
                          hasTrades ? (isPositive ? "text-profit" : "text-loss") : "text-muted-foreground",
                          isToday && "text-primary font-bold",
                        )}>
                          {d}
                        </span>
                        {hasTrades && (
                          <>
                            <span className={cn(
                              "text-[10px] sm:text-xs font-semibold leading-tight mt-0.5",
                              isPositive ? "text-profit" : "text-loss"
                            )}>
                              <span className="hidden sm:inline">{fmtMoney(cell.pnl)}</span>
                              <span className="sm:hidden">{fmtMoneyShort(cell.pnl)}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">
                              {cell.tradesCount}t
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}

                  {/* Week summary cell */}
                  <div className={cn(
                    "hidden sm:flex flex-col items-center justify-center rounded-lg min-h-[4.5rem] px-2 border-l border-border min-w-[5rem]",
                    ws.trades > 0 && (ws.pnl >= 0 ? "bg-profit/5" : "bg-loss/5"),
                  )}>
                    {ws.trades > 0 ? (
                      <>
                        <span className="text-[10px] text-muted-foreground font-medium">W{rowIdx + 1}</span>
                        <span className={cn(
                          "text-xs font-bold",
                          ws.pnl >= 0 ? "text-profit" : "text-loss"
                        )}>
                          {fmtMoneyShort(ws.pnl)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {ws.days}d · {ws.trades}t
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">W{rowIdx + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Panel */}
      {selectedDay && selectedDayTrades.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {formatDateShort(selectedDay, locale)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded p-1 hover:bg-muted text-muted-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <DayCard
              date={selectedDay}
              trades={selectedDayTrades}
              expanded={true}
              onToggle={() => setSelectedDay(null)}
              columns={columns}
              strategies={strategies}
              userTags={userTags}
              userTimezone={userTimezone}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Summary Card ─── */
function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className={cn("text-lg font-bold", color ?? "text-foreground")}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}
