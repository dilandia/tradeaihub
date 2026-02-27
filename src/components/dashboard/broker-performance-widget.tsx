"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

const H = "***";

function fmtPct(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function fmtMoney(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "--";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function BrokerPerformanceWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();
  const h = privacy;

  const gainColor =
    data.gain != null ? (data.gain >= 0 ? "text-profit" : "text-loss") : "text-foreground";

  const updatedAt = data._fetchedAt
    ? new Date(data._fetchedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-score" />
          {t("brokerMetrics.performanceTitle")}
          <WidgetTooltip text={t("brokerMetrics.performanceTooltip")} />
          {updatedAt && (
            <span className="ml-auto text-[10px] font-normal text-muted-foreground">
              {t("brokerMetrics.viaBroker")} {updatedAt}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Hero: Gain % */}
        <div className="text-center">
          <span className={`text-3xl font-bold ${gainColor}`}>
            {fmtPct(data.gain, h)}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("brokerMetrics.gain")}</p>
        </div>

        {/* Monthly Gain */}
        <div className="text-center">
          <span
            className={`text-lg font-semibold ${
              data.monthlyGain != null
                ? data.monthlyGain >= 0
                  ? "text-profit"
                  : "text-loss"
                : "text-foreground"
            }`}
          >
            {fmtPct(data.monthlyGain, h)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            {t("brokerMetrics.monthlyGain")}
          </span>
        </div>

        {/* Secondary metrics row */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-muted-foreground">CAGR</span>
            <span className="text-sm font-semibold text-foreground">
              {data.cagr != null ? fmtPct(data.cagr, h) : "--"}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("brokerMetrics.expectancy")}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {fmtMoney(data.expectancy, h)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase text-muted-foreground">PF</span>
            <span className="text-sm font-semibold text-foreground">
              {fmtNum(data.profitFactor)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
