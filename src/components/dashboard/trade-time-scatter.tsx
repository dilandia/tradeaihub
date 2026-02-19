"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeScatterPoint } from "@/lib/dashboard-calc";
import { Clock } from "lucide-react";
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

interface TradeTimeScatterProps {
  data: TimeScatterPoint[];
  privacy?: boolean;
  unit?: string;
}

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function TradeTimeScatter({ data, privacy = false, unit = "pips" }: TradeTimeScatterProps) {
  const wins = data.filter((d) => d.isWin);
  const losses = data.filter((d) => !d.isWin);

  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Performance por Horário
          <WidgetTooltip text="Horários em que os trades foram executados e a performance correspondente de cada um." />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Dados de horário não disponíveis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  type="number"
                  domain={[5, 20]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  stroke="var(--border)"
                  tickFormatter={(v) => formatHour(v)}
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
                    formatter={(value: number, _name: string, props: { payload?: TimeScatterPoint }) => [
                      unit === "$" ? `$${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : value,
                      props.payload ? `${props.payload.pair} (${formatHour(props.payload.hour)})` : "",
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
