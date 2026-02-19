"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { CalendarTrade } from "@/lib/calendar-utils";
import { WeekSection } from "@/components/day-view/week-section";
import { DayViewCalendar } from "@/components/day-view/day-view-calendar";
import { ColumnSelector, DEFAULT_COLUMNS } from "@/components/day-view/column-selector";
import type { ColumnKey } from "@/components/day-view/column-selector";

/** Retorna a semana do mês (1-5) a partir da data YYYY-MM-DD */
function getWeekOfMonth(date: string): number {
  const day = parseInt(date.slice(8, 10), 10);
  return Math.ceil(day / 7);
}

type Props = {
  trades: CalendarTrade[];
  initialDate?: string | null;
};

export function DayViewContent({ trades, initialDate }: Props) {
  const { t } = useLanguage();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [columns, setColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);

  /* Aplicar initialDate da URL (ex.: vindo do modal do calendário) */
  useEffect(() => {
    if (!initialDate || !/^\d{4}-\d{2}-\d{2}$/.test(initialDate)) return;
    const [y, m] = initialDate.split("-").map(Number);
    setCalYear(y);
    setCalMonth(m);
    setSelectedDate(initialDate);
    setExpandedDays((prev) => new Set(prev).add(initialDate));
    setExpandedWeeks((prev) => new Set(prev).add(getWeekOfMonth(initialDate)));
    const scrollToDay = () => {
      const el = document.getElementById(`day-${initialDate}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = setTimeout(scrollToDay, 400);
    return () => clearTimeout(t);
  }, [initialDate]);

  /* Agrupar trades por data (ordenado desc) */
  const dayGroups = useMemo(() => {
    const map = new Map<string, CalendarTrade[]>();
    for (const t of trades) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [trades]);

  /* Dias exibidos: filtrar pelo mês selecionado no calendário */
  const filteredDays = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth).padStart(2, "0")}`;
    return dayGroups.filter(([date]) => date.startsWith(prefix));
  }, [dayGroups, calYear, calMonth]);

  /* Agrupar dias por semana (1-5) */
  const weeksData = useMemo(() => {
    const byWeek = new Map<number, [string, CalendarTrade[]][]>();
    for (const entry of filteredDays) {
      const week = getWeekOfMonth(entry[0]);
      const arr = byWeek.get(week) ?? [];
      arr.push(entry);
      byWeek.set(week, arr);
    }
    for (const arr of byWeek.values()) {
      arr.sort((a, b) => b[0].localeCompare(a[0]));
    }
    const monthDays = new Date(calYear, calMonth, 0).getDate();
    const weekLabels: Record<number, string> = {};
    for (let w = 1; w <= 5; w++) {
      const start = (w - 1) * 7 + 1;
      const end = Math.min(w * 7, monthDays);
      if (start <= monthDays) {
        weekLabels[w] = `${t("dayView.week")} ${w} (${start}-${end})`;
      }
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNum, days]) => ({ weekNum, weekLabel: weekLabels[weekNum] ?? `${t("dayView.week")} ${weekNum}`, days }));
  }, [filteredDays, calYear, calMonth, t]);

  const totalDays = weeksData.reduce((s, w) => s + w.days.length, 0);

  const toggleDay = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  const toggleWeek = useCallback((weekNum: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekNum)) next.delete(weekNum);
      else next.add(weekNum);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedWeeks(new Set(weeksData.map((w) => w.weekNum)));
    setExpandedDays(new Set(filteredDays.map(([d]) => d)));
  }, [weeksData, filteredDays]);

  const collapseAll = useCallback(() => {
    setExpandedWeeks(new Set());
    setExpandedDays(new Set());
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    const weekNum = getWeekOfMonth(date);
    setExpandedWeeks((prev) => new Set(prev).add(weekNum));
    setExpandedDays((prev) => new Set(prev).add(date));
    setTimeout(() => {
      const el = document.getElementById(`day-${date}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, []);

  const handleMonthChange = useCallback((y: number, m: number) => {
    setCalYear(y);
    setCalMonth(m);
    setSelectedDate(null);
    const prefix = `${y}-${String(m).padStart(2, "0")}`;
    const newDays = dayGroups.filter(([date]) => date.startsWith(prefix));
    const weekNums = [...new Set(newDays.map(([d]) => getWeekOfMonth(d)))];
    setExpandedWeeks(new Set(weekNums));
    setExpandedDays(new Set(newDays.slice(0, 5).map(([d]) => d)));
  }, [dayGroups]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <h1 className="text-lg font-bold text-foreground">{t("dayView.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setColumnSelectorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t("dayView.columns")}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col-reverse gap-6 p-4 sm:p-6 lg:flex-row">
        {/* Left: Day list */}
        <div className="flex-1 space-y-3">
          {/* Collapse/Expand controls */}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={collapseAll}
              className="font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              {t("dayView.collapseAll")}
            </button>
            <button
              type="button"
              onClick={expandAll}
              className="font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              {t("dayView.expandAll")}
            </button>
            {filteredDays.length > 0 && (
              <span className="ml-auto text-muted-foreground/60">
                {t("dayView.daysOf", { visible: String(totalDays), total: String(filteredDays.length) })}
              </span>
            )}
          </div>

          {/* Day cards */}
          {filteredDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {t("dayView.noTradesMonth")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {t("dayView.selectMonthOrImport")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeksData.map(({ weekNum, weekLabel, days }) => (
                <WeekSection
                  key={weekNum}
                  weekNum={weekNum}
                  weekLabel={weekLabel}
                  days={days}
                  expandedDays={expandedDays}
                  onToggleDay={toggleDay}
                  columns={columns}
                  expandedWeeks={expandedWeeks}
                  onToggleWeek={toggleWeek}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Calendar sidebar (sticky) */}
        <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64 lg:self-start">
          <DayViewCalendar
            trades={trades}
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />

          {/* Month summary below calendar */}
          <MonthSummary trades={trades} year={calYear} month={calMonth} />
        </div>
      </div>

      {/* Column selector modal */}
      <ColumnSelector
        open={columnSelectorOpen}
        onClose={() => setColumnSelectorOpen(false)}
        columns={columns}
        onUpdate={setColumns}
      />
    </div>
  );
}

/* ─── Month Summary ─── */

function MonthSummary({ trades, year, month }: { trades: CalendarTrade[]; year: number; month: number }) {
  const { t } = useLanguage();
  const stats = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const monthTrades = trades.filter((t) => t.date.startsWith(prefix));
    if (monthTrades.length === 0) return null;

    const wins = monthTrades.filter((t) => t.is_win);
    const pnl = monthTrades.reduce((s, t) => s + (t.profit_dollar ?? t.pips), 0);
    const days = new Set(monthTrades.map((t) => t.date));
    const winDays = new Set<string>();
    const byDay = new Map<string, number>();
    for (const t of monthTrades) {
      byDay.set(t.date, (byDay.get(t.date) ?? 0) + (t.profit_dollar ?? t.pips));
    }
    for (const [d, p] of byDay) if (p > 0) winDays.add(d);

    return {
      trades: monthTrades.length,
      pnl,
      winRate: (wins.length / monthTrades.length) * 100,
      days: days.size,
      winDays: winDays.size,
    };
  }, [trades, year, month]);

  if (!stats) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("dayView.monthSummary")}</h4>
      <div className="space-y-1.5 text-sm">
        <Row label="P&L" value={`$${stats.pnl.toFixed(2)}`} color={stats.pnl >= 0 ? "text-profit" : "text-loss"} />
        <Row label={t("strategies.trades")} value={String(stats.trades)} />
        <Row label={t("overview.winRate")} value={`${stats.winRate.toFixed(1)}%`} />
        <Row label={t("dayView.tradedDays")} value={String(stats.days)} />
        <Row label={t("dayView.positiveDays")} value={`${stats.winDays} / ${stats.days}`} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={color ?? "text-foreground font-medium"}>{value}</span>
    </div>
  );
}
