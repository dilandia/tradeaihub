"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  X,
  Search,
  LayoutGrid,
  BarChart3,
  Table2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getWidgetDef, type WidgetGroup } from "@/lib/widget-registry";

/* ─── Group visual config ─── */

const GROUP_ICON: Record<WidgetGroup, typeof BarChart3> = {
  kpi: LayoutGrid,
  chart: BarChart3,
  table: Table2,
  calendar: CalendarDays,
};

const GROUP_COLOR: Record<WidgetGroup, string> = {
  kpi: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  chart: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  table: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  calendar: "text-violet-500 bg-violet-500/10 border-violet-500/20",
};

/* ─── Component ─── */

type Props = {
  availableIds: string[];
  onInsert: (id: string) => void;
  onClose: () => void;
  /** Renderiza o widget real como preview (opcional) */
  renderWidget?: (id: string) => ReactNode;
};

export function ChartLibraryModal({
  availableIds,
  onInsert,
  onClose,
  renderWidget,
}: Props) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return availableIds
      .map((id) => ({ id, def: getWidgetDef(id)! }))
      .filter(({ def }) => {
        if (!def) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t(def.labelKey).toLowerCase().includes(q) ||
          t(def.descriptionKey).toLowerCase().includes(q)
        );
      });
  }, [availableIds, search, t]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t("customize.chartLibrary")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("customize.chartLibraryDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("customize.searchWidgets")}
              className="w-full rounded-lg border border-border bg-muted/50 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score/30 focus:border-score/50"
            />
          </div>
        </div>

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <LayoutGrid className="h-10 w-10 opacity-30" />
              <p className="text-sm">{t("customize.allWidgetsAdded")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(({ id, def }) => {
                const Icon = GROUP_ICON[def.group];
                const color = GROUP_COLOR[def.group];
                const hasPreview = renderWidget != null;

                return (
                  <div
                    key={id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-border/80"
                  >
                    {/* Widget preview or icon thumbnail */}
                    {hasPreview ? (
                      <div className="w-20 h-16 shrink-0 rounded-lg border border-border overflow-hidden bg-muted/30">
                        <div className="w-full h-full transform scale-[0.25] origin-top-left pointer-events-none select-none" style={{ width: "400%", height: "400%" }}>
                          {renderWidget(id)}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border",
                          color
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {t(def.labelKey)}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t(def.descriptionKey)}
                      </p>
                    </div>

                    {/* Insert button */}
                    <button
                      type="button"
                      onClick={() => onInsert(id)}
                      className="shrink-0 self-center rounded-lg bg-score px-3 py-1.5 text-xs font-semibold text-white hover:bg-score/90 transition-colors whitespace-nowrap"
                    >
                      {t("customize.insertBtn")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("customize.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
