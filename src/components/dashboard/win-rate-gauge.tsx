"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";

interface WinRateGaugeProps {
  value: number;
  wins: number;
  losses: number;
  totalTrades: number;
  title?: string;
  className?: string;
  tooltip?: string;
}

/**
 * Trade win % — gauge circular + breakdown (ganhos / perdas / total).
 */
export function WinRateGauge({
  value,
  wins,
  losses,
  totalTrades,
  title = "Win %",
  className,
  tooltip,
}: WinRateGaugeProps) {
  const { t } = useLanguage();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden p-3", className)}>
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 pt-0">
        <div
          className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 shrink-0"
          role="img"
          aria-label={`Win rate: ${clamped}%`}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--profit)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(clamped / 100) * 264} 264`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className="relative z-10 text-base font-bold text-foreground sm:text-lg" aria-hidden>
            {`${clamped}%`}
          </span>
        </div>
        {/* Breakdown com labels */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-profit">{wins}</span>
            <span className="text-muted-foreground">{t("widgets.dayWinGains")}</span>
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-loss">{losses}</span>
            <span className="text-muted-foreground">{t("widgets.dayWinLosses")}</span>
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1">
            <span className="font-medium text-foreground">{totalTrades}</span>
            <span className="text-muted-foreground">{t("widgets.dayWinTotal")}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
