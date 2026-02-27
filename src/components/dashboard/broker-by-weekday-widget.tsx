"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

type WeekdayEntry = {
  day: number; // 0=Mon ... 4=Fri
  label: string;
  trades: number;
  wonPct: number;
};

const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_LABELS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function parseWeekdayData(raw: unknown[] | null): WeekdayEntry[] {
  if (!raw || !Array.isArray(raw)) return [];

  // MetaStats returns an object per day: { day: 0-6, totalTrades, wonTrades, lostTrades, ... }
  // or potentially { dayOfWeek: "MONDAY", ... }
  const result: WeekdayEntry[] = [];

  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;

    let dayIndex = -1;
    if (typeof rec.day === "number") {
      // MetaStats uses 0=Sunday, 1=Monday ... so adjust
      dayIndex = (rec.day as number) - 1; // shift so Monday=0
      if (dayIndex < 0 || dayIndex > 4) continue; // skip Sunday/Saturday
    }

    const trades = Number(rec.totalTrades ?? rec.trades ?? 0);
    const won = Number(rec.wonTrades ?? rec.won ?? 0);
    const wonPct = trades > 0 ? (won / trades) * 100 : 0;

    if (dayIndex >= 0) {
      result.push({ day: dayIndex, label: DAY_LABELS_EN[dayIndex], trades, wonPct });
    }
  }

  return result.sort((a, b) => a.day - b.day);
}

export function BrokerByWeekdayWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();

  const entries = parseWeekdayData(data.closeTradesByWeekDay);
  if (entries.length === 0) return null;

  const maxTrades = Math.max(...entries.map((e) => e.trades), 1);

  // Find best day
  const bestDay = entries.reduce(
    (best, e) => (e.wonPct > best.wonPct ? e : best),
    entries[0]
  );

  // Use localized labels
  const isPortuguese = t("brokerMetrics.byCurrencyTitle") !== "By Currency"; // simple heuristic
  const labels = isPortuguese ? DAY_LABELS_PT : DAY_LABELS_EN;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-score" />
          {t("brokerMetrics.byWeekdayTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Bar chart */}
        <div className="flex items-end justify-between gap-1">
          {entries.map((entry) => {
            const barH = (entry.trades / maxTrades) * 100;
            const isWinDominant = entry.wonPct >= 50;
            return (
              <div key={entry.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-foreground">
                  {privacy ? "***" : entry.trades}
                </span>
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-8 rounded-t transition-all ${
                      isWinDominant ? "bg-green-500/70" : "bg-red-500/70"
                    }`}
                    style={{ height: `${Math.max(barH, 4)}%` }}
                    role="progressbar"
                    aria-valuenow={entry.trades}
                    aria-label={`${labels[entry.day]}: ${entry.trades} trades, ${entry.wonPct.toFixed(0)}% win`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{labels[entry.day]}</span>
                <span
                  className={`text-[10px] font-medium ${
                    isWinDominant ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {entry.wonPct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Best day callout */}
        {bestDay && (
          <div className="mt-auto rounded-lg bg-muted/50 px-3 py-1.5 text-center text-xs text-muted-foreground">
            {t("brokerMetrics.bestDay")}: <strong className="text-foreground">{labels[bestDay.day]}</strong>{" "}
            ({bestDay.wonPct.toFixed(0)}% {t("brokerMetrics.winRateLabel")})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
