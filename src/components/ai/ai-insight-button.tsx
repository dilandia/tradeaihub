"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { isPlanGateError } from "@/lib/ai/plan-gate-error";
import { UpgradePlanModal } from "./upgrade-plan-modal";

const LOADING_INTERVAL_MS = 2200;

type Props = {
  onGenerate: () => Promise<string>;
  /** Quando definido, o resultado é passado ao parent em vez de exibir dropdown */
  onResult?: (result: string) => void;
  /** Chaves i18n para mensagens que alternam durante análise */
  loadingMessageKeys?: string[];
  className?: string;
};

export function AiInsightButton({ onGenerate, onResult, loadingMessageKeys, className }: Props) {
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

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw = await onGenerate();
      const text = typeof raw === "string" ? raw : typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? "");
      setResult(text);
      onResult?.(text);
    } catch (e) {
      if (isPlanGateError(e)) {
        setPlanGateModal({
          message: t(e.errorKey),
          variant: e.code,
        });
      } else {
        setError(e instanceof Error ? e.message : "Error");
      }
    } finally {
      setLoading(false);
    }
  }

  const showDropdown = !onResult && (result || error);

  return (
    <div className={cn("relative", className)}>
      {planGateModal && (
        <UpgradePlanModal
          open={!!planGateModal}
          onClose={() => setPlanGateModal(null)}
          message={planGateModal.message}
          variant={planGateModal.variant}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
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
            <span>{t("dashboard.aiGenerateInsights")}</span>
          </>
        )}
      </button>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-border bg-card p-4 shadow-xl"
          >
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : result ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {result}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
