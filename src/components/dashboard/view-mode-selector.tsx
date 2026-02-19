"use client";

import { useState, useRef, useEffect } from "react";
import {
  DollarSign,
  Percent,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

export type ViewMode = "dollar" | "percentage" | "pips" | "privacy";

const VIEW_MODES: { value: ViewMode; labelKey: string; icon: React.ElementType; descKey?: string }[] = [
  { value: "dollar", labelKey: "viewMode.dollar", icon: DollarSign },
  { value: "percentage", labelKey: "viewMode.percentage", icon: Percent },
  { value: "pips", labelKey: "viewMode.pips", icon: PipsIcon },
  { value: "privacy", labelKey: "viewMode.privacy", icon: EyeOff, descKey: "viewMode.privacyDesc" },
];

function PipsIcon({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center justify-center font-bold text-[10px] leading-none", className)}>
      PP
    </span>
  );
}

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeSelector({ value, onChange }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = VIEW_MODES.find((m) => m.value === value) ?? VIEW_MODES[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3",
          "text-sm font-medium text-foreground transition-colors",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
        )}
        aria-label={t("viewMode.ariaLabel")}
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-score/15 text-score">
          <CurrentIcon className="h-3.5 w-3.5" />
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {VIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = value === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => {
                  onChange(mode.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-score/10 text-score"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    isActive ? "bg-score/20 text-score" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{t(mode.labelKey)}</span>
                  {mode.descKey && (
                    <span className="text-xs text-muted-foreground">{t(mode.descKey)}</span>
                  )}
                </div>
                {isActive && (
                  <svg className="ml-auto h-4 w-4 text-score" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
