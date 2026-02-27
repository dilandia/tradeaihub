"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MetricsSummary } from "@/lib/account-metrics";

type Props = {
  data: MetricsSummary;
  privacy?: boolean;
};

const H = "***";

function fmtMoney(v: number | null | undefined, hide: boolean): string {
  if (hide) return H;
  if (v == null) return "--";
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "--";
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function BrokerExtremesWidget({ data, privacy = false }: Props) {
  const { t } = useLanguage();
  const h = privacy;

  const avgWin = data.averageWin ?? 0;
  const avgLoss = Math.abs(data.averageLoss ?? 0);
  const ratio = avgLoss > 0 ? avgWin / avgLoss : 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Target className="h-4 w-4 text-score" />
          {t("brokerMetrics.extremesTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Best / Worst */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 rounded-lg bg-green-500/5 p-2">
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("brokerMetrics.bestTrade")}
            </span>
            <span className="text-base font-bold text-profit">
              {fmtMoney(data.bestTrade, h)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {h ? H : fmtDate(data.bestTradeDate)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-red-500/5 p-2">
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("brokerMetrics.worstTrade")}
            </span>
            <span className="text-base font-bold text-loss">
              {fmtMoney(data.worstTrade, h)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {h ? H : fmtDate(data.worstTradeDate)}
            </span>
          </div>
        </div>

        {/* Avg Win / Loss / Ratio */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t("brokerMetrics.avgWin")}</span>
            <span className="text-sm font-semibold text-profit">{fmtMoney(data.averageWin, h)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t("brokerMetrics.avgLoss")}</span>
            <span className="text-sm font-semibold text-loss">{fmtMoney(data.averageLoss, h)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t("brokerMetrics.ratioLabel")}</span>
            <span className="text-sm font-semibold text-foreground">
              {h ? H : ratio > 0 ? `${ratio.toFixed(1)}:1` : "--"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
