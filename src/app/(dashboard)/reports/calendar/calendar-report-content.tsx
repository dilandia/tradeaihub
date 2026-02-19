"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getMonthNamesShort, getWeekdayNames } from "@/lib/i18n/date-utils";
import { buildCalendarDataFromTrades } from "@/lib/calendar-utils";
import type { CalendarTrade } from "@/lib/calendar-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { trades: CalendarTrade[] };

export function CalendarReportContent({ trades }: Props) {
  const { locale } = useLanguage();
  const monthNames = useMemo(() => getMonthNamesShort(locale), [locale]);
  const dayNames = useMemo(() => getWeekdayNames(locale, "short"), [locale]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const calData = useMemo(
    () => buildCalendarDataFromTrades(trades, year, month, true),
    [trades, year, month]
  );

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayPnl = new Map<string, number>();
  for (const d of calData.days) {
    dayPnl.set(d.date, d.pnl);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Calendar</h1>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (month === 1) {
                  setMonth(12);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
              className="rounded p-2 hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold">{monthNames[month - 1]} {year}</span>
            <button
              type="button"
              onClick={() => {
                if (month === 12) {
                  setMonth(1);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
              className="rounded p-2 hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {dayNames.map((d, i) => (
              <div key={`wd-${i}`} className="font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {cells.map((d, i) => {
              if (d == null) return <div key={i} />;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const pnl = dayPnl.get(dateStr);
              const hasData = pnl !== undefined && pnl !== 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded p-2 text-sm",
                    hasData && pnl! > 0 && "bg-profit/20 text-profit font-medium",
                    hasData && pnl! < 0 && "bg-loss/20 text-loss font-medium"
                  )}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
