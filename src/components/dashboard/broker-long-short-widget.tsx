"use client";

import { ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "--";
  return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function BrokerLongShortWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();

  const longCount = data.longTrades ?? 0;
  const shortCount = data.shortTrades ?? 0;
  const total = longCount + shortCount;
  const longPct = total > 0 ? (longCount / total) * 100 : 50;
  const shortPct = total > 0 ? (shortCount / total) * 100 : 50;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <ArrowUpDown className="h-4 w-4 text-score" />
          {t("brokerMetrics.longShortTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Proportion bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Long</span>
            <span>Short</span>
          </div>
          <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${longPct}%` }}
              aria-label={`Long ${longPct.toFixed(0)}%`}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${shortPct}%` }}
              aria-label={`Short ${shortPct.toFixed(0)}%`}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-green-500">
              {privacy ? "***" : longCount} ({longPct.toFixed(0)}%)
            </span>
            <span className="font-semibold text-red-500">
              {privacy ? "***" : shortCount} ({shortPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Win rates */}
        <div className="mt-auto space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("brokerMetrics.winRateLabel")}
          </p>
          {/* Long win rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Long</span>
              <span className="font-semibold text-green-500">
                {fmtPct(data.longWonTradesPercent)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500/60 transition-all"
                style={{ width: `${data.longWonTradesPercent ?? 0}%` }}
              />
            </div>
          </div>
          {/* Short win rate */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Short</span>
              <span className="font-semibold text-red-500">
                {fmtPct(data.shortWonTradesPercent)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-red-500/60 transition-all"
                style={{ width: `${data.shortWonTradesPercent ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
