"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DurationScatterPoint } from "@/lib/dashboard-calc";
import { Timer } from "lucide-react";
import { WidgetTooltip } from "./widget-tooltip";
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

interface TradeDurationScatterProps {
  data: DurationScatterPoint[];
  privacy?: boolean;
  unit?: string;
}

function formatDurationTick(mins: number): string {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}

export function TradeDurationScatter({ data, privacy = false, unit = "pips" }: TradeDurationScatterProps) {
  const wins = data.filter((d) => d.isWin);
  const losses = data.filter((d) => !d.isWin);

  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Timer className="h-4 w-4 text-muted-foreground" />
          Performance por Duração
          <WidgetTooltip text="Duração dos trades e a performance correspondente. Mostra se trades mais longos ou curtos são mais lucrativos." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Dados de duração não disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="duration"
                  type="number"
                  scale="log"
                  domain={["auto", "auto"]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  stroke="var(--border)"
                  tickFormatter={(v) => formatDurationTick(v)}
                />
                <YAxis
                  dataKey="pnl"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  stroke="var(--border)"
                  tickFormatter={(v) => (privacy ? "•••" : (unit === "$" ? `$${v}` : `${v}`))}
                />
                <ZAxis type="number" dataKey="pnl" range={[80, 400]} />
                {!privacy && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem",
                    }}
                    formatter={(value: number, _name: string, props: { payload?: DurationScatterPoint }) => [
                      unit === "$" ? `$${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : value,
                      props.payload?.durationLabel ?? "",
                    ]}
                  />
                )}
                <Scatter name="Vitórias" data={wins} fill="#10B981" />
                <Scatter name="Perdas" data={losses} fill="#EF4444" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
