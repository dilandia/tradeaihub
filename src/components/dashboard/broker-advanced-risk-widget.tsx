"use client";

import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "@/components/dashboard/widget-tooltip";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

type RiskOfRuinEntry = {
  level: number;
  probability: number;
};

const H = "***";

function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v == null) return "--";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  return `${v >= 0 ? "+" : ""}${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function fmtMoney(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  return `$${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "--";
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function interpretZScore(v: number | null, t: (key: string) => string): string {
  if (v == null) return "--";
  if (Math.abs(v) > 1.96) return t("brokerMetrics.zScoreStreakDepend");
  return t("brokerMetrics.zScoreRandom");
}

function interpretKurtosis(v: number | null, t: (key: string) => string): string {
  if (v == null) return "--";
  if (v > 3) return t("brokerMetrics.kurtosisFatTails");
  if (v < 3) return t("brokerMetrics.kurtosisThinTails");
  return t("brokerMetrics.kurtosisNormal");
}

function parseRiskOfRuin(raw: unknown[] | null): RiskOfRuinEntry[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      level: Number(item.level ?? item.percent ?? item.threshold ?? 0),
      probability: Number(item.probability ?? item.value ?? 0),
    }))
    .filter((e) => e.level > 0)
    .sort((a, b) => b.level - a.level); // highest level first (90%, 75%, 50%)
}

export function BrokerAdvancedRiskWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();
  const h = privacy;

  const riskOfRuin = parseRiskOfRuin(data.riskOfRuin);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Brain className="h-4 w-4 text-score" />
          {t("brokerMetrics.advancedRiskTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Statistical metrics grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Z-Score */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Z-Score</span>
              <WidgetTooltip text={t("brokerMetrics.zScoreTooltip")} />
            </div>
            <span className="text-sm font-semibold text-foreground">{fmtNum(data.zScore)}</span>
            <span className="text-[10px] text-muted-foreground">
              {interpretZScore(data.zScore, t)}
            </span>
          </div>

          {/* Std Dev */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Std Dev</span>
              <WidgetTooltip text={t("brokerMetrics.stdDevTooltip")} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {fmtNum(data.standardDeviationProfit, 4)}
            </span>
          </div>

          {/* Kurtosis */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Kurtosis</span>
            <span className="text-sm font-semibold text-foreground">
              {fmtNum(data.kurtosisProfit)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {interpretKurtosis(data.kurtosisProfit, t)}
            </span>
          </div>

          {/* CAGR */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">CAGR</span>
              <WidgetTooltip text={t("brokerMetrics.cagrTooltip")} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {fmtPct(data.cagr, h)}
            </span>
          </div>

          {/* MAR Ratio */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">MAR</span>
              <WidgetTooltip text={t("brokerMetrics.marTooltip")} />
            </div>
            <span className="text-sm font-semibold text-foreground">{fmtNum(data.mar)}</span>
          </div>

          {/* Daily Gain */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("brokerMetrics.dailyGain")}</span>
            <span className="text-sm font-semibold text-foreground">
              {fmtPct(data.dailyGain, h)}
            </span>
          </div>
        </div>

        {/* Risk of Ruin table */}
        {riskOfRuin.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold text-foreground">
              {t("brokerMetrics.riskOfRuinTitle")}
            </h4>
            <div className="space-y-1.5">
              {riskOfRuin.map((entry) => (
                <div key={entry.level} className="flex items-center gap-3">
                  <span className="w-40 text-xs text-muted-foreground">
                    {t("brokerMetrics.balanceDropTo")} {entry.level}%
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          entry.probability < 5
                            ? "bg-green-500"
                            : entry.probability < 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(entry.probability, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs font-semibold text-foreground">
                    {h ? H : `${entry.probability.toFixed(1)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highest Balance */}
        {data.highestBalance != null && (
          <div className="rounded-lg bg-muted/50 px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {t("brokerMetrics.highestBalance")}:{" "}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {fmtMoney(data.highestBalance, h)}
            </span>
            {data.highestBalanceDate && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({h ? H : fmtDate(data.highestBalanceDate)})
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
