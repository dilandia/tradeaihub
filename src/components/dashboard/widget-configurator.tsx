"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getWidgetDef } from "@/lib/widget-registry";
import type { WidgetPreferences } from "@/hooks/use-widget-preferences";

type Props = {
  prefs: WidgetPreferences;
  onToggle: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onReset: () => void;
};

/* ─── Sortable Item ─── */

function SortableWidget({
  id,
  isHidden,
  onToggle,
}: {
  id: string;
  isHidden: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const def = getWidgetDef(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!def) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
        isDragging
          ? "z-50 border-score bg-card shadow-lg shadow-score/10"
          : "border-border bg-card/50 hover:bg-card",
        isHidden && "opacity-50"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{t(def.labelKey)}</p>
        <p className="text-xs text-muted-foreground truncate">{t(def.descriptionKey)}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "shrink-0 rounded-md p-1.5 transition-colors",
          isHidden
            ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            : "text-profit hover:text-profit/80 hover:bg-profit/10"
        )}
        aria-label={isHidden ? `${t("widgets.show")} ${t(def.labelKey)}` : `${t("widgets.hide")} ${t(def.labelKey)}`}
      >
        {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─── Configurator Panel ─── */

export function WidgetConfigurator({ prefs, onToggle, onReorder, onReset }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = prefs.order.indexOf(active.id as string);
    const newIdx = prefs.order.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(prefs.order, oldIdx, newIdx));
  }

  const visibleCount = prefs.order.filter((id) => !prefs.hidden.includes(id)).length;

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-colors",
          open
            ? "border-score bg-score/10 text-score"
            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        aria-label={t("widgets.customize")}
      >
        <Settings2 className="h-5 w-5" />
      </button>

      {/* Overlay + Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t("widgets.customizeDashboard")}</h2>
                <p className="text-xs text-muted-foreground">{t("widgets.visibleWidgets", { count: visibleCount })}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("widgets.restore")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sortable list */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                {t("widgets.dragToReorder")}
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={prefs.order} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {prefs.order.map((id) => (
                      <SortableWidget
                        key={id}
                        id={id}
                        isHidden={prefs.hidden.includes(id)}
                        onToggle={() => onToggle(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </>
      )}
    </>
  );
}
