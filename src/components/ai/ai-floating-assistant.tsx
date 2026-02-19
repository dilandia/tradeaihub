"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import { AiCopilotContent } from "./ai-copilot-content";
import { UpgradePlanModal } from "./upgrade-plan-modal";
import { cn } from "@/lib/utils";

type AssistantView = "closed" | "menu" | "copilot";

type Props = {
  visible?: boolean;
};

export function AiFloatingAssistant({ visible = true }: Props) {
  const { t, locale } = useLanguage();
  const { planInfo } = usePlan();
  const [view, setView] = useState<AssistantView>("closed");
  const [planGateModal, setPlanGateModal] = useState<{ message: string; variant: "plan" | "credits" } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const canUseCopilot = (planInfo?.plan ?? "free") === "elite";
  const hasCredits = (planInfo?.aiCreditsRemaining ?? 0) > 0;

  useEffect(() => {
    if (view === "closed") return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setView("closed");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [view]);

  useEffect(() => {
    if (view !== "closed") {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setView("closed");
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [view]);

  function handleOpenCopilot() {
    if (!canUseCopilot) {
      setPlanGateModal({
        message: t("planErrors.aiCopilotElite"),
        variant: "plan",
      });
      return;
    }
    if (!hasCredits) {
      setPlanGateModal({
        message: t("planErrors.creditsZero"),
        variant: "credits",
      });
      return;
    }
    setView("copilot");
  }

  if (!visible) return null;

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
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <AnimatePresence>
          {view !== "closed" && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
                view === "copilot"
                  ? "h-[min(600px,calc(100vh-6rem))] w-[min(420px,calc(100vw-2rem))]"
                  : "w-80"
              )}
              role="dialog"
              aria-labelledby="ai-assistant-title"
            >
              {view === "menu" && (
                <>
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20">
                        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h2 id="ai-assistant-title" className="font-semibold text-foreground">
                        {t("aiAssistant.title")}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView("closed")}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      aria-label={t("common.closeMenu")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("aiAssistant.welcomeMessage")}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/ai-hub"
                        onClick={() => setView("closed")}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-border px-4 py-3",
                          "bg-muted/30 text-foreground transition-colors hover:bg-muted/50 hover:border-violet-500/30"
                        )}
                      >
                        <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        <span className="font-medium">{t("aiAssistant.goToHub")}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleOpenCopilot}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-violet-500/30 px-4 py-3 text-left",
                          "bg-gradient-to-r from-violet-500/15 to-cyan-500/10 text-violet-700 dark:text-violet-300",
                          "transition-colors hover:from-violet-500/25 hover:to-cyan-500/15 hover:border-violet-500/50"
                        )}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-medium">{t("aiAssistant.openCopilot")}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              {view === "copilot" && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
                    <h2 id="ai-assistant-title" className="font-semibold text-foreground text-sm">
                      {t("aiCopilot.header")}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setView("closed")}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      aria-label={t("common.closeMenu")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <AiCopilotContent compact />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => setView(view === "closed" ? "menu" : "closed")}
          className={cn(
            "flex items-center gap-2 rounded-full border border-violet-500/30 px-4 py-2.5 text-sm font-medium",
            "bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-violet-600 shadow-lg shadow-violet-500/20",
            "backdrop-blur-sm transition-all hover:scale-105 hover:border-violet-500/50 hover:shadow-violet-500/30 dark:text-violet-400"
          )}
          aria-label={t("aiAssistant.barLabel")}
          aria-expanded={view !== "closed"}
        >
          <Sparkles className="h-4 w-4" />
          <span>{t("aiAssistant.barLabel")}</span>
        </motion.button>
      </div>
    </>
  );
}
