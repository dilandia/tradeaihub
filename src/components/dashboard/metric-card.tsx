"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "profit" | "loss" | "score";
  children?: React.ReactNode;
  className?: string;
  tooltip?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  children,
  className,
  tooltip,
}: MetricCardProps) {
  return (
    <Card className={cn("flex h-full flex-col overflow-hidden p-3", className)}>
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1.5 pt-0">
        <CardTitle className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {title}
          {tooltip && <WidgetTooltip text={tooltip} />}
        </CardTitle>
        {Icon && (
          <span className="rounded-lg bg-muted p-1 shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </span>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-center pt-0">
        <div
          className={cn(
            "flex items-center gap-1.5 text-lg font-bold leading-tight sm:text-xl",
            variant === "profit" && "text-profit",
            variant === "loss" && "text-loss",
            variant === "score" && "text-score",
            variant === "default" && "text-foreground"
          )}
        >
          {trend === "up" && <TrendingUp className="h-4 w-4 shrink-0 text-profit" aria-hidden />}
          {trend === "down" && <TrendingDown className="h-4 w-4 shrink-0 text-loss" aria-hidden />}
          {value}
        </div>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
