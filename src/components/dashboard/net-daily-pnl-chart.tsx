"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DailyPnlPoint } from "@/lib/dashboard-calc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { WidgetTooltip } from "./widget-tooltip";

const PROFIT = "#10B981";
const LOSS = "#EF4444";

interface NetDailyPnlChartProps {
  data: DailyPnlPoint[];
  privacy?: boolean;
  unit?: string;
}

function fmtTooltipVal(v: number, unit: string): string {
  if (unit === "$") return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (unit === "%") return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  return `${v >= 0 ? "+" : ""}${v} ${unit}`;
}

function CustomTooltip({
  active,
  payload,
  privacy,
  unit = "pips",
}: {
  active?: boolean;
  payload?: Array<{ payload?: DailyPnlPoint }>;
  privacy?: boolean;
  unit?: string;
}) {
  if (!active || !payload?.length || privacy) return null;
  const point = payload[0]?.payload as DailyPnlPoint | undefined;
  if (!point) return null;
  const { date, pnl } = point;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{date}</p>
      <p className={cn("font-semibold", pnl >= 0 ? "text-profit" : "text-loss")}>
        {fmtTooltipVal(pnl, unit)}
      </p>
    </div>
  );
}

export function NetDailyPnlChart({ data, privacy = false, unit = "pips" }: NetDailyPnlChartProps) {
  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          P&L diário {unit !== "pips" ? `(${unit})` : ""}
          <WidgetTooltip text="P&L líquido total de cada dia de negociação, no dia em que foi realizado." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
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
                  return String(v);
                }}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <CustomTooltip active={active} payload={payload} privacy={privacy} unit={unit} />
                )}
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pnl >= 0 ? PROFIT : LOSS}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
