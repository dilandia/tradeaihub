"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import { useAiApiParams } from "@/hooks/use-ai-api";
import {
  fetchAiInsights,
  fetchAiPatterns,
  fetchAiRisk,
  fetchAiReportSummary,
  fetchAiTakerzScore,
} from "@/hooks/use-ai-api";
import { AiAgentCard } from "@/components/ai/ai-agent-card";
import {
  Sparkles,
  BarChart3,
  GitCompare,
  Shield,
  Target,
  ArrowRight,
  Gauge,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AiHubPage() {
  const { t } = useLanguage();
  const { planInfo, canUseAi } = usePlan();
  const params = useAiApiParams();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-background to-cyan-500/10 p-8 lg:p-12"
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
            {t("aiHub.badge")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {t("aiHub.heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
            {t("aiHub.heroDesc")}
          </p>
        </div>
      </motion.div>

      {/* Credits banner (Pro/Elite) */}
      {canUseAi() && planInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3"
        >
          <span className="text-sm font-medium text-foreground">
            {t("aiHub.creditsRemaining", { count: planInfo.aiCreditsRemaining, total: planInfo.aiCreditsPerMonth })}
          </span>
          <Link
            href="/settings/subscription"
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            {t("aiHub.buyCredits")}
          </Link>
        </motion.div>
      )}

      {/* Agents grid: 2x2 + Takerz Score central (dobro da largura) */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-2"
      >
        <motion.div variants={item}>
          <AiAgentCard
            title={t("aiHub.performanceInsights")}
            description={t("aiHub.performanceInsightsDesc")}
            icon={<BarChart3 className="h-5 w-5" />}
            onGenerate={() => fetchAiInsights(params)}
            loadingMessageKeys={["common.aiGeneratingInsights", "common.aiIdentifyingTrends", "common.aiAnalyzing"]}
          />
        </motion.div>
        <motion.div variants={item}>
          <AiAgentCard
            title={t("aiHub.patternDetection")}
            description={t("aiHub.patternDetectionDesc")}
            icon={<Target className="h-5 w-5" />}
            onGenerate={() => fetchAiPatterns(params)}
            loadingMessageKeys={["common.aiAnalyzingPatterns", "common.aiSearchingPatterns", "common.aiIdentifyingTrends"]}
          />
        </motion.div>
        <motion.div variants={item}>
          <AiAgentCard
            title={t("aiHub.riskAnalysis")}
            description={t("aiHub.riskAnalysisDesc")}
            icon={<Shield className="h-5 w-5" />}
            onGenerate={() => fetchAiRisk(params)}
            loadingMessageKeys={["common.aiCalculatingRisk", "common.aiAnalyzing", "common.aiIdentifyingTrends"]}
          />
        </motion.div>
        <motion.div variants={item}>
          <AiAgentCard
            title={t("aiHub.reportSummary")}
            description={t("aiHub.reportSummaryDesc")}
            icon={<GitCompare className="h-5 w-5" />}
            onGenerate={() => fetchAiReportSummary({ ...params, reportType: "Overview" })}
            loadingMessageKeys={["common.aiGeneratingInsights", "common.aiAnalyzing", "common.aiIdentifyingTrends"]}
          />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-2">
          <AiAgentCard
            title={t("aiHub.takerzScoreExplanation")}
            description={t("aiHub.takerzScoreExplanationDesc")}
            icon={<Gauge className="h-5 w-5" />}
            onGenerate={() => fetchAiTakerzScore(params)}
            loadingMessageKeys={["common.aiAnalyzing", "common.aiGeneratingInsights", "common.aiIdentifyingTrends"]}
          />
        </motion.div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 flex flex-wrap gap-4"
      >
        <Link
          href="/reports/overview"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t("aiHub.linkOverview")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/reports/risk"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t("aiHub.linkRisk")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/takerz-score"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t("aiHub.linkTakerzScore")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
