"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";

interface WinRateGaugeProps {
  value: number;
  title?: string;
  className?: string;
  tooltip?: string;
}

export function WinRateGauge({
  value,
  title = "Win %",
  className,
  tooltip,
}: WinRateGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden p-3", className)}>
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center pt-0">
        <div
          className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14"
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
      </CardContent>
    </Card>
  );
}
