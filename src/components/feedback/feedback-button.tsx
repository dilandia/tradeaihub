"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("feedback.title")}
        className={cn(
          "fixed bottom-6 left-6 z-40",
          "flex h-11 w-11 items-center justify-center rounded-full",
          "bg-score text-white shadow-lg",
          "transition-all hover:scale-105 hover:bg-score/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-score focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
