"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RadarMetrics } from "@/lib/dashboard-calc";
import { computeZellaScore } from "@/lib/dashboard-calc";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { WidgetTooltip } from "./widget-tooltip";

const SCORE_COLOR = "#7C3AED";

const LABELS: Record<keyof RadarMetrics, string> = {
  winRate: "Win %",
  consistency: "Consistência",
  profitFactor: "Profit Factor",
  maxDrawdown: "Max Drawdown",
  avgWinLoss: "Avg Win/Loss",
  recoveryFactor: "Recovery Factor",
};

interface ZellaRadarChartProps {
  data: RadarMetrics;
  privacy?: boolean;
}

function toRadarData(metrics: RadarMetrics) {
  return (Object.keys(LABELS) as (keyof RadarMetrics)[]).map((key) => ({
    subject: LABELS[key],
    value: metrics[key],
    fullMark: 100,
  }));
}

/** Cor da barra do gauge baseada na faixa de score */
function scoreColor(score: number): string {
  if (score >= 70) return "#10B981"; // verde
  if (score >= 40) return "#F59E0B"; // amarelo
  return "#EF4444"; // vermelho
}

function ScoreGauge({ score, privacy }: { score: number; privacy: boolean }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="mt-2 flex shrink-0 flex-col gap-1">
      <div className="flex w-full items-center justify-between">
        <Link
          href="/takerz-score"
          className="text-xs font-medium text-score transition-colors hover:underline"
        >
          Your Takerz Score
        </Link>
        <span className={cn("text-lg font-bold", privacy ? "text-muted-foreground" : "text-score")}>
          {privacy ? "•••" : score.toFixed(1)}
        </span>
      </div>
      {/* Barra de progresso — sempre visível */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full min-w-[2px] rounded-full transition-all duration-500"
          style={{
            width: privacy ? "0%" : `${pct}%`,
            background: `linear-gradient(90deg, ${scoreColor(score)}, ${SCORE_COLOR})`,
          }}
        />
      </div>
      <div className="flex w-full justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
        <span>100</span>
      </div>
    </div>
  );
}

export function ZellaRadarChart({ data, privacy = false }: ZellaRadarChartProps) {
  const chartData = toRadarData(data);
  const zellaScore = computeZellaScore(data);

  return (
    <Card className="flex h-[315px] flex-col overflow-hidden">
      <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          Takerz Score
          <WidgetTooltip text="Avalia sua performance combinando as métricas mais essenciais em um score ponderado: Win% (15%), Avg Win/Loss (20%), Profit Factor (25%), Max Drawdown (20%), Recovery Factor (10%) e Consistência (10%)." />
        </CardTitle>
        <Link
          href="/takerz-score"
          className="text-xs text-muted-foreground/70 transition-colors hover:text-score hover:underline"
        >
          Saiba mais
        </Link>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-0">
        {/* Radar Chart */}
        <div className="h-[180px] w-full shrink-0">
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickFormatter={(v) => (privacy ? "" : String(v))}
              />
              {!privacy && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}/100`, "Score"]}
                />
              )}
              <Radar
                name="Score"
                dataKey="value"
                stroke={SCORE_COLOR}
                fill={SCORE_COLOR}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Gauge Bar */}
        <ScoreGauge score={zellaScore} privacy={privacy} />
      </CardContent>
    </Card>
  );
}
