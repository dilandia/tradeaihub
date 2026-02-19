"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WidgetTooltip } from "./widget-tooltip";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export interface PnlPoint {
  date: string;
  cumulative: number;
}

interface CumulativePnlChartProps {
  data: PnlPoint[];
  title?: string;
  className?: string;
  privacy?: boolean;
  unit?: string;
  compact?: boolean;
}

function fmtVal(v: number, unit: string): string {
  if (unit === "$") return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unit === "%") return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  return `${v >= 0 ? "+" : ""}${v} ${unit}`;
}

export function CumulativePnlChart({
  data,
  title = "Cumulative P&L",
  className,
  privacy = false,
  unit = "pips",
  compact,
}: CumulativePnlChartProps) {
  return (
    <Card className={cn("flex h-[315px] flex-col overflow-hidden", className)}>
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
          {title}
          <WidgetTooltip text="Evolução do P&L total acumulado ao longo de cada dia de negociação." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
                tickFormatter={(v) => {
                  if (privacy) return "•••";
                  if (unit === "$") return `$${v}`;
                  if (unit === "%") return `${v}%`;
                  return `${v}`;
                }}
              />
              {!privacy && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: number) => [fmtVal(value, unit), "P&L"]}
                />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="var(--profit)"
                strokeWidth={2}
                fill="url(#pnlGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
