"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { submitFeedback } from "@/app/actions/feedback";
import { cn } from "@/lib/utils";

const NPS_LAST_SHOWN = "NPS_LAST_SHOWN";
const NPS_DISMISSED_UNTIL = "NPS_DISMISSED_UNTIL";
const NPS_COOLDOWN_DAYS = 30;

function shouldShowNps(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const dismissedUntil = localStorage.getItem(NPS_DISMISSED_UNTIL);
    if (dismissedUntil) {
      const until = new Date(dismissedUntil);
      if (until > new Date()) return false;
    }

    const lastShown = localStorage.getItem(NPS_LAST_SHOWN);
    if (lastShown) {
      const last = new Date(lastShown);
      const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < NPS_COOLDOWN_DAYS) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function markNpsShown() {
  try {
    localStorage.setItem(NPS_LAST_SHOWN, new Date().toISOString());
  } catch {
    // localStorage may be unavailable
  }
}

function dismissNps() {
  try {
    const until = new Date();
    until.setDate(until.getDate() + NPS_COOLDOWN_DAYS);
    localStorage.setItem(NPS_DISMISSED_UNTIL, until.toISOString());
    localStorage.setItem(NPS_LAST_SHOWN, new Date().toISOString());
  } catch {
    // localStorage may be unavailable
  }
}

export function NpsSurvey() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Delay showing NPS to not distract on page load
    const timer = setTimeout(() => {
      if (shouldShowNps()) {
        setVisible(true);
        markNpsShown();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    dismissNps();
    setVisible(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (score === null) return;

    setSubmitting(true);
    try {
      const npsMessage = `NPS Score: ${score}/10${comment.trim() ? ` — ${comment.trim()}` : ""}`;

      const result = await submitFeedback({
        type: "other",
        rating: Math.min(5, Math.max(1, Math.round(score / 2))),
        message: npsMessage,
        pageUrl: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (result.success) {
        setSubmitted(true);
        dismissNps();
        toast.success(t("nps.thanks"));
        setTimeout(() => setVisible(false), 1500);
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }, [score, comment, t]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-20 left-6 z-[60] w-[340px]",
            "rounded-xl border border-border bg-card p-5 shadow-xl"
          )}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-4 text-center"
              >
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <p className="text-sm font-medium text-foreground">
                  {t("nps.thanks")}
                </p>
              </motion.div>
            ) : (
              <motion.div key="survey" exit={{ opacity: 0 }} className="space-y-4">
                {/* Question */}
                <p className="pr-6 text-sm font-medium leading-snug text-foreground">
                  {t("nps.question")}
                </p>

                {/* Score 0-10 */}
                <div>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setScore(n)}
                        className={cn(
                          "h-8 flex-1 rounded text-xs font-medium transition-all",
                          score === n
                            ? n <= 6
                              ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                              : n <= 8
                                ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40"
                                : "bg-green-500/20 text-green-400 ring-1 ring-green-500/40"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional comment (shows after score selection) */}
                {score !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t("nps.commentPlaceholder")}
                      rows={2}
                      className={cn(
                        "w-full resize-none rounded-lg border border-border bg-background px-3 py-2",
                        "text-sm text-foreground placeholder:text-muted-foreground",
                        "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                      )}
                    />
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("nps.dismiss")}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={score === null || submitting}
                    className={cn(
                      "rounded-lg bg-score px-4 py-1.5 text-xs font-medium text-white",
                      "transition-colors hover:bg-score/90",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {submitting ? "..." : t("nps.submit")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
