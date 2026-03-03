"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = VIEW_MODES.find((m) => m.value === value) ?? VIEW_MODES[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    setRect(buttonRef.current?.getBoundingClientRect() ?? null);
    function handler(e: MouseEvent | TouchEvent) {
      const target = (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node | null;
      if (!target) return;
      if (ref.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
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

      {open && typeof document !== "undefined" && rect && createPortal(
        <div
          ref={dropdownRef}
          className="fixed max-w-[calc(100vw-1rem)] w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 z-[9999]"
          style={(() => {
            const dropdownWidth = 224;
            const vw = window.innerWidth;
            const pos: React.CSSProperties = { top: rect.bottom + 6 };
            // Right-align with button, clamped to viewport
            let right = vw - rect.right;
            if (vw - right - dropdownWidth < 8) {
              right = vw - dropdownWidth - 8;
            }
            pos.right = Math.max(8, right);
            return pos;
          })()}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
}
