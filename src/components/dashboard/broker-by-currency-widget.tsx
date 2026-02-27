"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

type CurrencyEntry = {
  currency: string;
  pnl: number;
};

const H = "***";

function parseCurrencySummary(raw: unknown[] | null): CurrencyEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      currency: String(item.currency ?? item.symbol ?? ""),
      pnl: Number(item.pnl ?? item.profit ?? item.totalProfit ?? 0),
    }))
    .filter((e) => e.currency.length > 0)
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
}

function fmtMoney(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function BrokerByCurrencyWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const entries = parseCurrencySummary(data.currencySummary);
  if (entries.length === 0) return null;

  const maxAbs = Math.max(...entries.map((e) => Math.abs(e.pnl)), 1);
  const visible = expanded ? entries : entries.slice(0, 5);
  const hasMore = entries.length > 5;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Coins className="h-4 w-4 text-score" />
          {t("brokerMetrics.byCurrencyTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {visible.map((entry) => {
          const pct = (Math.abs(entry.pnl) / maxAbs) * 100;
          const isProfit = entry.pnl >= 0;
          return (
            <div key={entry.currency} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-medium text-foreground">
                {entry.currency}
              </span>
              <div className="relative flex-1">
                <div className="h-4 w-full overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full rounded transition-all ${isProfit ? "bg-green-500/70" : "bg-red-500/70"}`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.abs(entry.pnl)}
                    aria-label={`${entry.currency}: ${fmtMoney(entry.pnl)}`}
                  />
                </div>
              </div>
              <span
                className={`w-20 shrink-0 text-right text-xs font-semibold ${isProfit ? "text-profit" : "text-loss"}`}
              >
                {privacy ? H : fmtMoney(entry.pnl)}
              </span>
            </div>
          );
        })}

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-score hover:text-score/80 transition-colors"
          >
            {expanded
              ? t("brokerMetrics.showLess")
              : t("brokerMetrics.showAll", { count: String(entries.length) })}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
