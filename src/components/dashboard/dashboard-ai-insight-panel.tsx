"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import {
  TrendingUp,
  Target,
  DollarSign,
  Percent,
  Sparkles,
} from "lucide-react";
import { AiResponseContent } from "@/components/ai/ai-response-content";
import { cn } from "@/lib/utils";

type MetricCard = {
  labelKey: string;
  value: string;
  type: "pct" | "factor" | "currency" | "neutral";
  icon: React.ReactNode;
};

/** Extrai métricas-chave do texto da IA para exibir como cards visuais */
function extractHeroMetrics(text: string): MetricCard[] {
  const metrics: MetricCard[] = [];

  // Win Rate / Taxa de vitória (inclui "Strong Win Rate", "High Win Rate", etc.)
  const winRateMatch = text.match(
    /(?:Strong Win Rate|High Win Rate|Win Rate|Taxa de vitória|win rate)[:\s]*(\d+\.?\d*)%?/i
  );
  if (winRateMatch) {
    const pct = winRateMatch[1];
    metrics.push({
      labelKey: "dashboard.aiMetricWinRate",
      value: `${pct}%`,
      type: "pct",
      icon: <Target className="h-5 w-5" />,
    });
  }

  // Profit Factor (inclui "High Profit Factor", etc.)
  const pfMatch = text.match(
    /(?:High Profit Factor|Profit Factor|Fator de lucro|profit factor)[:\s]*(\d+\.?\d*)/i
  );
  if (pfMatch) {
    metrics.push({
      labelKey: "dashboard.aiMetricProfitFactor",
      value: pfMatch[1],
      type: "factor",
      icon: <TrendingUp className="h-5 w-5" />,
    });
  }

  // PnL / Lucro (primeiro valor $ com sinal)
  const pnlMatch = text.match(/([+-]?\$[\d,]+\.?\d*)/);
  if (pnlMatch && metrics.length < 4) {
    metrics.push({
      labelKey: "dashboard.aiMetricPnl",
      value: pnlMatch[1],
      type: "currency",
      icon: <DollarSign className="h-5 w-5" />,
    });
  }

  // Day Win % se não tiver Win Rate
  if (metrics.length < 2) {
    const dayWinMatch = text.match(
      /(?:Day Win|Dias positivos)[:\s]*(\d+\.?\d*)%?/i
    );
    if (dayWinMatch) {
      metrics.push({
        labelKey: "dashboard.aiMetricDayWin",
        value: `${dayWinMatch[1]}%`,
        type: "pct",
        icon: <Percent className="h-5 w-5" />,
      });
    }
  }

  return metrics.slice(0, 4); // Máximo 4 cards
}

type Props = {
  content: string;
  onClose?: () => void;
};

export function DashboardAiInsightPanel({ content, onClose }: Props) {
  const { t } = useLanguage();
  const heroMetrics = extractHeroMetrics(content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative mt-4 overflow-hidden rounded-2xl",
        "border border-violet-500/25",
        "bg-gradient-to-br from-violet-500/10 via-background/95 to-cyan-500/5",
        "backdrop-blur-md shadow-xl shadow-violet-500/10",
        "ring-1 ring-white/10 dark:ring-white/5"
      )}
    >
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-32 w-32 rounded-full bg-cyan-500/15 blur-2xl" />

      <div className="relative p-6 sm:p-8">
        {/* Hero metrics - cards visuais */}
        {heroMetrics.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {heroMetrics.map((m, i) => (
              <motion.div
                key={m.labelKey}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i, duration: 0.25 }}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-4",
                  "border border-white/10 bg-white/50 dark:bg-white/5",
                  "backdrop-blur-sm"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    m.type === "pct" && "bg-violet-500/25 text-violet-600 dark:text-violet-400",
                    m.type === "factor" && "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400",
                    m.type === "currency" &&
                      (m.value.startsWith("-")
                        ? "bg-red-500/25 text-red-600 dark:text-red-400"
                        : "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400"),
                    m.type === "neutral" && "bg-muted text-muted-foreground"
                  )}
                >
                  {m.icon}
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t(m.labelKey)}
                </span>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums sm:text-2xl",
                    m.type === "pct" && "text-violet-700 dark:text-violet-300",
                    m.type === "factor" && "text-emerald-700 dark:text-emerald-300",
                    m.value.startsWith("-") && "text-red-600 dark:text-red-400",
                    !m.value.startsWith("-") && m.type === "currency" && "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {m.value}
                </span>
                {m.type === "pct" && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, parseFloat(m.value) || 0)}%`,
                      }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        (parseFloat(m.value) || 0) >= 60
                          ? "bg-emerald-500"
                          : (parseFloat(m.value) || 0) >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Badge "Gerado por IA" */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
          <Sparkles className="h-3.5 w-3.5" />
          {t("dashboard.aiInsightsFullAnalysis")}
        </div>

        {/* Conteúdo textual formatado */}
        <div className="rounded-xl bg-muted/20 p-4 ring-1 ring-border/40 sm:p-5">
          <AiResponseContent content={content} />
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("dashboard.aiInsightsHide")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
