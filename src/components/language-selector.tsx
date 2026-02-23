"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

const LOCALE_SHORT: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
};

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDropdownRect(buttonRef.current?.getBoundingClientRect() ?? null);
    function handler(e: MouseEvent | TouchEvent) {
      const target = (e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node | null;
      if (!target) return;
      const insideTrigger = ref.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (insideTrigger || insideDropdown) return;
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
          "inline-flex h-10 min-h-[44px] items-center gap-1 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
        )}
        aria-expanded={open}
        aria-label={t("common.selectLanguage")}
        title={LOCALE_LABELS[locale]}
      >
        <span>{LOCALE_SHORT[locale]}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && typeof document !== "undefined" && dropdownRect && createPortal(
        <div
          ref={dropdownRef}
          className="fixed max-w-[calc(100vw-1rem)] w-48 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 z-[9999]"
          style={(() => {
            const dropdownWidth = 192;
            const spaceRight = window.innerWidth - dropdownRect.right;
            const spaceLeft = dropdownRect.left;
            const pos: React.CSSProperties = { top: dropdownRect.bottom + 6 };
            if (spaceRight >= dropdownWidth || spaceRight >= spaceLeft) {
              pos.right = Math.max(8, spaceRight);
            } else {
              pos.left = Math.max(8, spaceLeft);
            }
            return pos;
          })()}
        >
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocale(loc as Locale);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                locale === loc
                  ? "bg-score/10 text-score font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {locale === loc && (
                <span className="h-2 w-2 rounded-full bg-score" />
              )}
              <span className={cn(!(locale === loc) && "ml-4")}>
                {LOCALE_LABELS[loc]}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
