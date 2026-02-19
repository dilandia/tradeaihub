"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WidgetTooltip } from "./widget-tooltip";
import type { DrawdownPoint } from "@/lib/dashboard-calc";
import { TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DrawdownChartProps {
  data: DrawdownPoint[];
  privacy?: boolean;
  unit?: string;
}

export function DrawdownChart({ data, privacy = false, unit = "pips" }: DrawdownChartProps) {
  const minDrawdown = data.length > 0 ? Math.min(...data.map((d) => d.drawdown), 0) : 0;

  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          Drawdown
          <WidgetTooltip text="Queda do P&L desde o pico máximo atingido. Mostra o risco de perdas acumuladas ao longo do tempo." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                stroke="var(--border)"
              />
              <YAxis
                domain={[minDrawdown, 0]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                stroke="var(--border)"
                tickFormatter={(v) => (privacy ? "•••" : (unit === "$" ? `$${v}` : `${v}`))}
              />
              {!privacy && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: number) => [
                    unit === "$" ? `$${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : value,
                    "Drawdown",
                  ]}
                />
              )}
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#drawdownGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
