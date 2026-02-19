"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BalancePoint } from "@/lib/dashboard-calc";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WidgetTooltip } from "./widget-tooltip";

const SCORE = "#7C3AED";

interface AccountBalanceChartProps {
  data: BalancePoint[];
  privacy?: boolean;
  unit?: string;
}

function fmtBalanceVal(v: number, unit: string): string {
  if (unit === "$") return `${v >= 0 ? "+$" : "-$"}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${v >= 0 ? "+" : ""}${v} ${unit}`;
}

function CustomTooltip({
  active,
  payload,
  privacy,
  unit = "pips",
}: {
  active?: boolean;
  payload?: Array<{ payload?: BalancePoint }>;
  privacy?: boolean;
  unit?: string;
}) {
  if (!active || !payload?.length || privacy) return null;
  const point = payload[0]?.payload as BalancePoint | undefined;
  if (!point) return null;
  const { date, balance } = point;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{date}</p>
      <p className="font-semibold text-score">
        {fmtBalanceVal(balance, unit)}
      </p>
    </div>
  );
}

export function AccountBalanceChart({ data, privacy = false, unit = "pips" }: AccountBalanceChartProps) {
  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          Saldo acumulado
          <WidgetTooltip text="Soma do saldo inicial com o lucro/prejuízo líquido total realizado de todos os trades fechados." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SCORE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={SCORE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                stroke="var(--border)"
                tickFormatter={(v) => (privacy ? "•••" : (unit === "$" ? `$${v}` : String(v)))}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <CustomTooltip active={active} payload={payload} privacy={privacy} unit={unit} />
                )}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={SCORE}
                strokeWidth={2}
                fill="url(#balanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
