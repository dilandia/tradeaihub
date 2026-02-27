"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

const H = "***";

type Severity = "good" | "fair" | "poor";

function getSortinoSeverity(v: number | null): Severity {
  if (v == null) return "fair";
  if (v > 2) return "good";
  if (v >= 1) return "fair";
  return "poor";
}

function getSharpeSeverity(v: number | null): Severity {
  if (v == null) return "fair";
  if (v > 1.5) return "good";
  if (v >= 0.5) return "fair";
  return "poor";
}

function getDrawdownSeverity(v: number | null, highestBalance: number | null): Severity {
  if (v == null || highestBalance == null || highestBalance === 0) return "fair";
  const pct = (Math.abs(v) / highestBalance) * 100;
  if (pct < 10) return "good";
  if (pct <= 20) return "fair";
  return "poor";
}

function severityColor(s: Severity): string {
  if (s === "good") return "text-green-500 bg-green-500/10 border-green-500/20";
  if (s === "fair") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  return "text-red-500 bg-red-500/10 border-red-500/20";
}

function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "--";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMoney(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BrokerRiskQualityWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();

  const sortinoSev = getSortinoSeverity(data.sortinoRatio);
  const sharpeSev = getSharpeSeverity(data.sharpeRatio);
  const ddSev = getDrawdownSeverity(data.maxDrawdown, data.highestBalance);

  const ddPct =
    data.maxDrawdown != null && data.highestBalance != null && data.highestBalance > 0
      ? (Math.abs(data.maxDrawdown) / data.highestBalance) * 100
      : null;

  const severityLabels: Record<string, Record<Severity, string>> = {
    sortino: {
      good: t("brokerMetrics.severityGood"),
      fair: t("brokerMetrics.severityFair"),
      poor: t("brokerMetrics.severityPoor"),
    },
    sharpe: {
      good: t("brokerMetrics.severityGood"),
      fair: t("brokerMetrics.severityFair"),
      poor: t("brokerMetrics.severityPoor"),
    },
    dd: {
      good: t("brokerMetrics.severityLow"),
      fair: t("brokerMetrics.severityModerate"),
      poor: t("brokerMetrics.severityHigh"),
    },
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Shield className="h-4 w-4 text-score" />
          {t("brokerMetrics.riskQualityTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Ratios grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Sortino */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Sortino</span>
              <WidgetTooltip text={t("brokerMetrics.sortinoTooltip")} />
            </div>
            <span className="text-lg font-bold text-foreground">{fmtNum(data.sortinoRatio)}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(sortinoSev)}`}
              aria-label={`Sortino: ${severityLabels.sortino[sortinoSev]}`}
            >
              {severityLabels.sortino[sortinoSev]}
            </span>
          </div>

          {/* Sharpe */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Sharpe</span>
              <WidgetTooltip text={t("brokerMetrics.sharpeTooltip")} />
            </div>
            <span className="text-lg font-bold text-foreground">{fmtNum(data.sharpeRatio)}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(sharpeSev)}`}
              aria-label={`Sharpe: ${severityLabels.sharpe[sharpeSev]}`}
            >
              {severityLabels.sharpe[sharpeSev]}
            </span>
          </div>

          {/* Max DD */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Max DD</span>
              <WidgetTooltip text={t("brokerMetrics.maxDrawdownTooltip")} />
            </div>
            <span className="text-lg font-bold text-foreground">
              {fmtMoney(data.maxDrawdown != null ? -Math.abs(data.maxDrawdown) : null, privacy)}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColor(ddSev)}`}
              aria-label={`Max Drawdown: ${severityLabels.dd[ddSev]}`}
            >
              {severityLabels.dd[ddSev]}
            </span>
          </div>
        </div>

        {/* Drawdown bar */}
        {ddPct != null && (
          <div className="mt-auto">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{t("brokerMetrics.drawdownBar")}</span>
              <span>{ddPct.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  ddPct < 10 ? "bg-green-500" : ddPct <= 20 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(ddPct, 100)}%` }}
                role="progressbar"
                aria-valuenow={ddPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Drawdown ${ddPct.toFixed(1)}% of highest balance`}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {ddPct.toFixed(1)}% {t("brokerMetrics.ofHighestBalance")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
