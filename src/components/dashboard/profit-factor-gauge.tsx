"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";

interface ProfitFactorGaugeProps {
  value: number;
  title?: string;
  className?: string;
  tooltip?: string;
}

export function ProfitFactorGauge({
  value,
  title = "Profit Factor",
  className,
  tooltip,
}: ProfitFactorGaugeProps) {
  const normalized = Math.min(3, Math.max(0, value));
  const pct = (normalized / 3) * 100;

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden p-3", className)}>
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center pt-0">
        <p className="text-lg font-bold leading-tight text-foreground sm:text-xl">
          {value.toFixed(2)}
        </p>
        <div className="mt-1.5 w-full overflow-hidden rounded-full bg-muted h-1.5">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              value >= 1.5 ? "bg-profit" : value >= 1 ? "bg-score" : "bg-loss"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
