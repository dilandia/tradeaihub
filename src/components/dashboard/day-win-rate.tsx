"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DayWinRateResult } from "@/lib/dashboard-calc";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { WidgetTooltip } from "./widget-tooltip";

const PROFIT = "#10B981";
const LOSS = "#EF4444";

interface DayWinRateProps extends DayWinRateResult {
  title?: string;
  tooltip?: string;
}

export function DayWinRate({
  winDays,
  lossDays,
  totalDays,
  dayWinPct,
  title = "Dias positivos",
  tooltip,
}: DayWinRateProps) {
  const chartData = [
    { name: "positivos", value: winDays, color: PROFIT },
    { name: "negativos", value: lossDays, color: LOSS },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    chartData.push({ name: "vazio", value: 1, color: "var(--border)" });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {title}
          <WidgetTooltip text={tooltip ?? "Porcentagem de dias de negociação lucrativos sobre o total de dias negociados."} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={50}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-2xl font-bold text-foreground">
            {`${dayWinPct}%`}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {`${winDays} dias positivos / ${totalDays} dias`}
        </p>
      </CardContent>
    </Card>
  );
}
