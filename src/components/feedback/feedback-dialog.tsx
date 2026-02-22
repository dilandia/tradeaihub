"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Bug, Lightbulb, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { submitFeedback, type FeedbackType } from "@/app/actions/feedback";
import { cn } from "@/lib/utils";

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
};

const FEEDBACK_TYPES: { value: FeedbackType; icon: typeof Bug; tKey: string }[] = [
  { value: "bug", icon: Bug, tKey: "feedback.typeBug" },
  { value: "feature", icon: Lightbulb, tKey: "feedback.typeFeature" },
  { value: "improvement", icon: Sparkles, tKey: "feedback.typeImprovement" },
  { value: "other", icon: HelpCircle, tKey: "feedback.typeOther" },
];

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<FeedbackType>("improvement");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setType("improvement");
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    // Reset form after close animation
    setTimeout(resetForm, 300);
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (message.trim().length < 10) return;

    setSubmitting(true);
    try {
      const result = await submitFeedback({
        type,
        rating: rating > 0 ? rating : null,
        message,
        pageUrl: typeof window !== "undefined" ? window.location.href : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (result.success) {
        setSubmitted(true);
        toast.success(t("feedback.success"));
        setTimeout(handleClose, 2000);
      } else {
        toast.error(result.error ?? "Failed to submit feedback");
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }, [type, rating, message, t, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-md -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2",
              "rounded-xl border border-border bg-card p-4 shadow-xl sm:p-6"
            )}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {t("feedback.title")}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </motion.div>
                  <p className="text-lg font-medium text-foreground">
                    {t("feedback.success")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("feedback.successDesc")}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0 }} className="space-y-5">
                  {/* Type selector */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t("feedback.type")}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {FEEDBACK_TYPES.map(({ value, icon: Icon, tKey }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setType(value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs transition-all",
                            type === value
                              ? "border-score bg-score/10 text-score"
                              : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-center leading-tight">{t(tKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t("feedback.rating")}
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-score"
                        >
                          <Star
                            className={cn(
                              "h-6 w-6 transition-colors",
                              (hoverRating || rating) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/40"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      {t("feedback.message")} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("feedback.messagePlaceholder")}
                      rows={4}
                      className={cn(
                        "w-full resize-none rounded-lg border border-border bg-background px-3 py-2",
                        "text-sm text-foreground placeholder:text-muted-foreground",
                        "transition-colors focus:border-score focus:outline-none focus:ring-1 focus:ring-score"
                      )}
                    />
                    {message.length > 0 && message.trim().length < 10 && (
                      <p className="mt-1 text-xs text-red-400">
                        {t("feedback.messageMin")}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || message.trim().length < 10}
                    className={cn(
                      "w-full rounded-lg bg-score px-4 py-2.5 text-sm font-medium text-white",
                      "transition-colors hover:bg-score/90",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-score focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    )}
                  >
                    {submitting ? t("feedback.submitting") : t("feedback.submit")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
