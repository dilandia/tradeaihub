"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiResponseContent } from "./ai-response-content";
import { UpgradePlanModal } from "./upgrade-plan-modal";
import { useLanguage } from "@/contexts/language-context";
import { isPlanGateError } from "@/lib/ai/plan-gate-error";

/** Chaves i18n para mensagens que alternam durante o loading (ex: "common.aiAnalyzingPatterns") */
type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onGenerate: () => Promise<string>;
  /** Chaves de tradução para mensagens que alternam durante análise (ex: ["common.aiAnalyzingPatterns", "common.aiSearchingPatterns"]) */
  loadingMessageKeys?: string[];
  variant?: "default" | "compact";
  className?: string;
};

const LOADING_INTERVAL_MS = 2200;

export function AiAgentCard({
  title,
  description,
  icon,
  onGenerate,
  loadingMessageKeys,
  variant = "default",
  className,
}: Props) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planGateModal, setPlanGateModal] = useState<{ message: string; variant: "plan" | "credits" } | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const messages = loadingMessageKeys?.map((k) => t(k)) ?? [t("common.aiAnalyzing")];
  const currentMessage = messages[loadingStep % messages.length];

  useEffect(() => {
    const count = loadingMessageKeys?.length ?? 1;
    if (!loading || count <= 1) return;
    const id = setInterval(() => setLoadingStep((s) => s + 1), LOADING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading, loadingMessageKeys?.length]);

  useEffect(() => {
    if (!loading) setLoadingStep(0);
  }, [loading]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw = await onGenerate();
      const text = typeof raw === "string" ? raw : typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? "");
      setResult(text);
    } catch (e) {
      if (isPlanGateError(e)) {
        setPlanGateModal({
          message: t(e.errorKey),
          variant: e.code,
        });
      } else {
        const msg = e instanceof Error ? e.message : "Error";
        setError(msg.startsWith("planErrors.") ? t(msg) : msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {planGateModal && (
        <UpgradePlanModal
          open={!!planGateModal}
          onClose={() => setPlanGateModal(null)}
          message={planGateModal.message}
          variant={planGateModal.variant}
        />
      )}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-violet-500/5 via-background to-cyan-500/5",
        "shadow-lg shadow-violet-500/5 backdrop-blur-sm",
        "ring-1 ring-white/5 dark:ring-white/10",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/15 hover:border-violet-500/30",
        className
      )}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-cyan-500/15 blur-xl" />

        <div className="relative flex items-start justify-between gap-4 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30">
              {icon ?? <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {description && variant !== "compact" && (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "bg-violet-600 text-white hover:bg-violet-700",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "shadow-md shadow-violet-500/25"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{currentMessage}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t("common.aiGenerate")}</span>
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {(result || error) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-border/50"
            >
              <div className="p-4 sm:p-5">
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : result ? (
                  <div className="rounded-lg bg-muted/30 p-4 ring-1 ring-border/50">
                    <AiResponseContent content={result} />
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
}
