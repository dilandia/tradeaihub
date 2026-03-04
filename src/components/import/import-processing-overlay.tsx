"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
};

const STEPS = [
  { key: "import.stepReading" as const },
  { key: "import.stepProcessing" as const },
  { key: "import.stepSaving" as const },
];

const PROGRESS_WIDTHS = ["15%", "55%", "85%"] as const;

export function ImportProcessingOverlay({ open }: Props) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      return;
    }
    const timer1 = setTimeout(() => setCurrentStep(1), 2000);
    const timer2 = setTimeout(() => setCurrentStep(2), 8000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[111] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              aria-label={t("import.processingAriaLabel")}
              aria-busy="true"
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-score" />
              </div>

              <p className="mb-5 text-center text-lg font-semibold text-foreground">
                {t("import.processingTitle")}
              </p>

              <div className="space-y-3" aria-live="polite">
                {STEPS.map((step, i) => {
                  const status =
                    i < currentStep
                      ? "done"
                      : i === currentStep
                        ? "current"
                        : "waiting";
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      {status === "done" && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-profit" />
                      )}
                      {status === "current" && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-score" />
                      )}
                      {status === "waiting" && (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          status === "done" &&
                            "text-muted-foreground line-through",
                          status === "current" &&
                            "font-medium text-foreground",
                          status === "waiting" && "text-muted-foreground"
                        )}
                      >
                        {t(step.key)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-score transition-all duration-1000 ease-out"
                  style={{ width: PROGRESS_WIDTHS[currentStep] }}
                />
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("import.processingPatience")}
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
