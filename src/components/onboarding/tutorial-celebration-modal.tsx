"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "takez-tutorial-celebrated";

function wasCelebrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

function markCelebrated() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function TutorialCelebrationModal({ open, onClose }: Props) {
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      markCelebrated();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-[200px] w-[200px] items-center justify-center sm:h-[250px] sm:w-[250px]">
              {React.createElement("lord-icon", {
                src: "https://cdn.lordicon.com/yqgsjpsy.json",
                trigger: "in",
                stroke: "light",
                style: { width: "100%", height: "100%" },
                className: "[&>svg]:w-full [&>svg]:h-full",
              })}
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              {t("tutorial.celebrationTitle")}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t("tutorial.celebrationMessage")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-lg bg-score px-6 py-2.5 text-sm font-semibold text-white",
                "hover:bg-score/90 transition-colors"
              )}
            >
              {t("tutorial.celebrationContinue")}
            </button>
          </div>
        </div>
      </div>
  );
}

export { wasCelebrated };
