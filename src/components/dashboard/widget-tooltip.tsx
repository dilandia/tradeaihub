"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetTooltipProps {
  text: string;
  className?: string;
}

/**
 * Ícone (i) com tooltip explicativo ao passar o mouse / clicar (mobile).
 * Renderiza em portal para não ser cortado por overflow-hidden dos cards.
 */
export function WidgetTooltip({ text, className }: WidgetTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          tooltipRef.current && !tooltipRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const tooltipEl = open && typeof document !== "undefined" ? (
    createPortal(
      <div
        ref={tooltipRef}
        role="tooltip"
        className={cn(
          "fixed z-[9999] w-56 -translate-x-1/2 -translate-y-full",
          "rounded-lg bg-foreground px-3 py-2.5 text-xs leading-relaxed text-background shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
        style={{ top: pos.top, left: pos.left }}
      >
        {text}
        <div className="absolute left-1/2 top-full -translate-x-1/2">
          <div className="h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-foreground" />
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div ref={ref} className={cn("relative z-10 inline-flex shrink-0", className)}>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(!open);
            }
          }}
          className="inline-flex cursor-pointer items-center justify-center rounded-full p-0.5 text-muted-foreground/80 transition-colors hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score/50"
          aria-label="Informação sobre esta métrica"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
      </div>
      {tooltipEl}
    </>
  );
}
