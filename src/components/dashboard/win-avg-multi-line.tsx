"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WinAvgPoint } from "@/lib/dashboard-calc";
import { LineChart } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";
import {
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WinAvgMultiLineProps {
  data: WinAvgPoint[];
  privacy?: boolean;
  unit?: string;
}

export function WinAvgMultiLine({ data, privacy = false, unit = "pips" }: WinAvgMultiLineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <LineChart className="h-4 w-4 text-muted-foreground" />
          Win% - Avg Win - Avg Loss
          <WidgetTooltip text="Evolução semanal da taxa de acerto, lucro médio por trade vencedor e prejuízo médio por trade perdedor." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                stroke="var(--border)"
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                stroke="var(--border)"
                tickFormatter={(v) => (privacy ? "•••" : (unit === "$" ? `$${v}` : `${v}`))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                stroke="var(--border)"
                tickFormatter={(v) => (privacy ? "•••" : `${v}%`)}
              />
              {!privacy && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  formatter={(value: number, name: string) => [
                    privacy ? "•••" : (name === "Win %" ? `${value}%` : (unit === "$" ? `$${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : value)),
                    name,
                  ]}
                />
              )}
              {!privacy && (
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => value}
                  iconType="line"
                  iconSize={10}
                />
              )}
              <Line
                type="monotone"
                dataKey="winRate"
                name="Win %"
                stroke="#6366F1"
                strokeWidth={2}
                yAxisId="right"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgWin"
                name="Avg Win"
                stroke="#10B981"
                strokeWidth={2}
                yAxisId="left"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgLoss"
                name="Avg Loss"
                stroke="#EF4444"
                strokeWidth={2}
                yAxisId="left"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
