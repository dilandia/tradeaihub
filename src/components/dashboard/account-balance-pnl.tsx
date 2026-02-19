"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";

interface AccountBalancePnlProps {
  title: string;
  /** Saldo total (conta atual ou inicial + P&L). Null quando não disponível. */
  balance: number | null;
  pnlDisplay: string;
  variant: "profit" | "loss" | "default";
  tooltip: string;
  compact?: boolean;
  privacy?: boolean;
}

const H = "•••";

export function AccountBalancePnl({
  title,
  balance,
  pnlDisplay,
  variant,
  tooltip,
  privacy,
}: AccountBalancePnlProps) {
  const balanceStr =
    privacy || balance == null
      ? H
      : balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pnlStr = privacy ? H : pnlDisplay;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-3">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1.5 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 pt-0">
        <div
          className={cn(
            "text-lg font-bold leading-tight sm:text-xl",
            variant === "profit" && "text-profit",
            variant === "loss" && "text-loss",
            variant === "default" && "text-foreground"
          )}
        >
          {balanceStr}
        </div>
        <p
          className={cn(
            "text-[11px] leading-tight",
            variant === "profit" && "text-profit/80",
            variant === "loss" && "text-loss/80",
            variant === "default" && "text-muted-foreground"
          )}
        >
          P&L: {pnlStr}
        </p>
      </CardContent>
    </Card>
  );
}
