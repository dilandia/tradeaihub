"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAiApiParams } from "@/hooks/use-ai-api";
import { fetchAiInsights } from "@/hooks/use-ai-api";
import { AiInsightButton } from "@/components/ai/ai-insight-button";
import { DashboardAiInsightPanel } from "@/components/dashboard/dashboard-ai-insight-panel";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export function DashboardAiFooter() {
  const { t } = useLanguage();
  const params = useAiApiParams();
  const [result, setResult] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="mt-8"
    >
      <div
        className={cn(
          "rounded-2xl border border-violet-500/25 p-4 sm:p-5",
          "bg-gradient-to-r from-violet-500/15 via-background to-cyan-500/10",
          "backdrop-blur-sm shadow-lg shadow-violet-500/5",
          "ring-1 ring-white/5 dark:ring-white/10"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 text-violet-500 ring-1 ring-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("dashboard.aiInsightsTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.aiInsightsSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AiInsightButton
              onGenerate={() => fetchAiInsights(params)}
              onResult={setResult}
              loadingMessageKeys={["common.aiGeneratingInsights", "common.aiIdentifyingTrends", "common.aiAnalyzing"]}
            />
            <Link
              href="/ai-hub"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
              Central IA
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <DashboardAiInsightPanel
              content={result}
              onClose={() => setResult(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
