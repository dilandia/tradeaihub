"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";

interface AvgWinLossBarProps {
  avgWin: number | null;
  avgLoss: number | null;
  title?: string;
  className?: string;
  format?: (n: number) => string;
  tooltip?: string;
}

export function AvgWinLossBar({
  avgWin,
  avgLoss,
  title = "Avg Win / Loss",
  className,
  format = (n) => (n >= 0 ? `+${n}` : `${n}`),
  tooltip,
}: AvgWinLossBarProps) {
  const winVal = avgWin ?? 0;
  const lossVal = avgLoss ?? 0;
  const max = Math.max(Math.abs(winVal), Math.abs(lossVal), 1);
  const winW = (Math.abs(winVal) / max) * 50;
  const lossW = (Math.abs(lossVal) / max) * 50;

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden p-3", className)}>
      <CardHeader className="shrink-0 pb-1 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center pt-0">
        <div className="flex gap-1.5">
          <div
            className="flex flex-1 flex-col rounded-md bg-profit/10 p-1.5"
            style={{ flex: winW }}
          >
            <span className="text-[10px] text-muted-foreground">Avg Win</span>
            <span className="text-sm font-semibold text-profit">
              {avgWin != null ? format(avgWin) : "—"}
            </span>
          </div>
          <div
            className="flex flex-1 flex-col rounded-md bg-loss/10 p-1.5"
            style={{ flex: lossW }}
          >
            <span className="text-[10px] text-muted-foreground">Avg Loss</span>
            <span className="text-sm font-semibold text-loss">
              {avgLoss != null ? format(avgLoss) : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
