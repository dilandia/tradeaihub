"use client";

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

type HourEntry = {
  hour: number;
  trades: number;
};

function parseHourData(raw: unknown[] | null): HourEntry[] {
  if (!raw || !Array.isArray(raw)) return [];

  const result: HourEntry[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const hour = Number(rec.hour ?? rec.openHour ?? -1);
    const trades = Number(rec.totalTrades ?? rec.trades ?? 0);
    if (hour >= 0 && hour <= 23) {
      result.push({ hour, trades });
    }
  }

  return result.sort((a, b) => a.hour - b.hour);
}

export function BrokerByHourWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();

  const entries = parseHourData(data.openTradesByHour);
  if (entries.length === 0) return null;

  const maxTrades = Math.max(...entries.map((e) => e.trades), 1);
  const totalTrades = entries.reduce((s, e) => s + e.trades, 0);

  // Find peak hours (top 3 by trade count)
  const sorted = [...entries].sort((a, b) => b.trades - a.trades);
  const peakHours = sorted.slice(0, 3);
  const peakTradeCount = peakHours.reduce((s, e) => s + e.trades, 0);
  const peakPct = totalTrades > 0 ? (peakTradeCount / totalTrades) * 100 : 0;

  // Find contiguous peak range
  const peakStart = Math.min(...peakHours.map((e) => e.hour));
  const peakEnd = Math.max(...peakHours.map((e) => e.hour));

  // Build full 24h array
  const hoursMap = new Map(entries.map((e) => [e.hour, e.trades]));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="h-4 w-4 text-score" />
          {t("brokerMetrics.byHourTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Compact 24h bar visualization */}
        <div className="flex items-end gap-px">
          {Array.from({ length: 24 }, (_, h) => {
            const trades = hoursMap.get(h) ?? 0;
            const barH = maxTrades > 0 ? (trades / maxTrades) * 100 : 0;
            const isPeak = peakHours.some((p) => p.hour === h);
            return (
              <div
                key={h}
                className="flex flex-1 flex-col items-center"
                title={`${String(h).padStart(2, "0")}:00 - ${privacy ? "***" : trades} trades`}
              >
                <div className="flex h-14 w-full items-end justify-center">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPeak ? "bg-score" : "bg-muted-foreground/30"
                    }`}
                    style={{ height: `${Math.max(barH, 2)}%` }}
                    role="progressbar"
                    aria-valuenow={trades}
                    aria-label={`${String(h).padStart(2, "0")}:00 - ${trades} trades`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hour labels (show every 3h) */}
        <div className="flex justify-between px-0 text-[8px] text-muted-foreground">
          <span>0</span>
          <span>3</span>
          <span>6</span>
          <span>9</span>
          <span>12</span>
          <span>15</span>
          <span>18</span>
          <span>21</span>
        </div>

        {/* Peak info */}
        <div className="mt-auto space-y-1 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          <p>
            {t("brokerMetrics.peakHours")}:{" "}
            <strong className="text-foreground">
              {String(peakStart).padStart(2, "0")}:00 - {String(peakEnd).padStart(2, "0")}:00
            </strong>{" "}
            ({peakPct.toFixed(0)}%)
          </p>
          <p>
            {t("brokerMetrics.mostActive")}:{" "}
            <strong className="text-foreground">
              {String(sorted[0]?.hour ?? 0).padStart(2, "0")}:00
            </strong>{" "}
            ({privacy ? "***" : `${sorted[0]?.trades ?? 0} trades`})
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
