"use client";

import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIDGET_REGISTRY,
  DEFAULT_WIDGET_ORDER,
  DEFAULT_HIDDEN,
  getWidgetDef,
  getGridSpan,
  isSmallWidget,
} from "@/lib/widget-registry";
import type { WidgetPreferences } from "@/hooks/use-widget-preferences";
import type { useLayoutProfiles } from "@/hooks/use-layout-profiles";
import { ChartLibraryModal } from "./chart-library-modal";

import { TOP_ROW_MAX_ITEMS } from "@/lib/dashboard-constants";

/* ═══════════════════════════════════════════════
 * TOP ROW — máx 8 slots (2 linhas × 4 colunas)
 * ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
 * Sortable filled widget slot — renderiza o widget real
 * ═══════════════════════════════════════════════ */

function FilledSlot({
  id,
  children,
  onRemove,
}: {
  id: string;
  children: ReactNode;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all rounded-xl border-2 border-dashed border-muted-foreground/25",
        isDragging && "z-50 scale-[1.02] opacity-70"
      )}
    >
      {/* Drag handle overlay */}
      <div
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing rounded-xl"
        {...attributes}
        {...listeners}
      />

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 z-20 rounded-full bg-background/80 backdrop-blur p-1.5 text-muted-foreground hover:text-loss hover:bg-loss/10 opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-border/50"
        title={t("widgets.hide")}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Drag grip indicator */}
      <div className="absolute top-2 left-2 z-20 rounded-full bg-background/80 backdrop-blur p-1 text-muted-foreground/40 group-hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-border/50">
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Real widget content */}
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * Empty "Click to add widget" slot
 * ═══════════════════════════════════════════════ */

function EmptySlot({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed",
        "border-muted-foreground/30 bg-muted/10 text-muted-foreground/50",
        "hover:border-score/50 hover:text-score/70 hover:bg-score/5 transition-all",
        className
      )}
    >
      <span className="text-xs font-medium">{t("customize.clickToAdd")}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════
 * Drag overlay
 * ═══════════════════════════════════════════════ */

function DragOverlaySlot({
  id,
  children,
}: {
  id: string;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  const def = getWidgetDef(id);
  if (!def) return null;

  return (
    <div className="rounded-xl border-2 border-score shadow-2xl shadow-score/20 opacity-90 max-w-[300px]">
      {children ?? (
        <div className="bg-card rounded-xl p-4 flex items-center justify-center min-h-[100px]">
          <span className="text-sm font-medium text-foreground">
            {t(def.labelKey)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
 * Main Customize Component
 * ═══════════════════════════════════════════════ */

type Props = {
  prefs: WidgetPreferences;
  onSave: (prefs: WidgetPreferences) => void;
  onCancel: () => void;
  /** Aplica perfil e fecha — 1 clique para trocar */
  onApplyAndClose?: (prefs: WidgetPreferences) => void;
  renderWidget: (id: string) => ReactNode;
  layoutProfiles?: ReturnType<typeof useLayoutProfiles>;
};

export function DashboardCustomize({
  prefs,
  onSave,
  onCancel,
  onApplyAndClose,
  renderWidget,
  layoutProfiles,
}: Props) {
  const { t } = useLanguage();
  const [localOrder, setLocalOrder] = useState<string[]>(prefs.order);
  const [localHidden, setLocalHidden] = useState<string[]>(prefs.hidden);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [libraryTarget, setLibraryTarget] = useState<
    "top" | "main" | null
  >(null);
  const [profileNames, setProfileNames] = useState<[string, string]>(["", ""]);

  useEffect(() => {
    if (layoutProfiles?.loaded) {
      setProfileNames([
        layoutProfiles.getProfileName(1),
        layoutProfiles.getProfileName(2),
      ]);
    }
  }, [layoutProfiles?.loaded, layoutProfiles?.getProfileName]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  /* ─── Derived: top row máx 8, resto no grid principal ─── */
  const visibleIds = localOrder.filter((id) => !localHidden.includes(id));
  const smallVisibleIds = useMemo(
    () => visibleIds.filter((id) => isSmallWidget(id)),
    [visibleIds]
  );

  const topRowIds = useMemo(
    () => smallVisibleIds.slice(0, TOP_ROW_MAX_ITEMS),
    [smallVisibleIds]
  );

  const mainGridIds = useMemo(
    () => visibleIds.filter((id) => !isSmallWidget(id)),
    [visibleIds]
  );

  /* Hidden IDs filtrados por target */
  const hiddenSmallIds = useMemo(
    () =>
      WIDGET_REGISTRY.filter(
        (w) => w.placement === "any" && localHidden.includes(w.id)
      ).map((w) => w.id),
    [localHidden]
  );

  const hiddenLargeIds = useMemo(
    () =>
      WIDGET_REGISTRY.filter(
        (w) => w.placement === "main" && localHidden.includes(w.id)
      ).map((w) => w.id),
    [localHidden]
  );

  /* Empty slots para top row (até 8) */
  const topEmptyCount = Math.max(0, TOP_ROW_MAX_ITEMS - topRowIds.length);

  /* Empty slots para grid principal — sempre mostrar slots para adicionar ao lado dos widgets */
  const MAIN_COLS = 3;
  const mainEmptyCount = Math.max(6, MAIN_COLS * 2);

  const hasChanges =
    JSON.stringify(localOrder) !== JSON.stringify(prefs.order) ||
    JSON.stringify(localHidden) !== JSON.stringify(prefs.hidden);

  /* ─── Handlers ─── */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOrder((prev) => {
      const oldIdx = prev.indexOf(active.id as string);
      const newIdx = prev.indexOf(over.id as string);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLocalHidden((prev) => [...prev, id]);
  }, []);

  const insertWidget = useCallback((id: string) => {
    setLocalHidden((prev) => prev.filter((h) => h !== id));
    setLibraryTarget(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ order: localOrder, hidden: localHidden });
  }, [localOrder, localHidden, onSave]);

  const handleReset = useCallback(() => {
    setLocalOrder(DEFAULT_WIDGET_ORDER);
    setLocalHidden(DEFAULT_HIDDEN);
  }, []);

  const handleUseProfile = useCallback(
    (index: 1 | 2) => {
      const p = layoutProfiles?.loadProfile(index);
      if (p && onApplyAndClose) {
        onApplyAndClose(p);
      }
    },
    [layoutProfiles, onApplyAndClose]
  );

  const handleSaveToProfile = useCallback(
    (index: 1 | 2) => {
      const name = profileNames[index - 1]?.trim() || (index === 1 ? t("customize.profile1") : t("customize.profile2"));
      layoutProfiles?.saveToProfile(index, name, { order: localOrder, hidden: localHidden });
      setProfileNames((prev) => {
        const next = [...prev];
        next[index - 1] = name;
        return next as [string, string];
      });
      toast.success(t("customize.toastProfileSaved"));
    },
    [layoutProfiles, localOrder, localHidden, profileNames, t]
  );

  return (
    <div className="min-h-screen">
      {/* ═══════ TOOLBAR ═══════ */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2 px-4 lg:px-6">
          {/* Perfis de layout */}
          {layoutProfiles && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                {t("customize.layoutProfiles")}:
              </span>
              {([1, 2] as const).map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5"
                >
                  <input
                    type="text"
                    value={profileNames[idx - 1]}
                    onChange={(e) =>
                      setProfileNames((prev) => {
                        const next = [...prev];
                        next[idx - 1] = e.target.value;
                        return next as [string, string];
                      })
                    }
                    placeholder={t("customize.profileNamePlaceholder")}
                    className="h-6 w-20 rounded border-0 bg-transparent px-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-score"
                  />
                  {layoutProfiles.hasProfile(idx) && onApplyAndClose ? (
                    <button
                      type="button"
                      onClick={() => handleUseProfile(idx)}
                      title={t("customize.useProfileDesc")}
                      className="rounded bg-score px-2 py-0.5 text-xs font-medium text-white hover:bg-score/90"
                    >
                      {t("customize.useProfile")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleSaveToProfile(idx)}
                    className="rounded border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {t("customize.saveToProfile")}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2",
              layoutProfiles && "border-l border-border/60 pl-3"
            )}
          >
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {t("widgets.restore")}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {t("customize.cancel")}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                hasChanges
                  ? "bg-score text-white hover:bg-score/90 shadow-sm"
                  : "bg-score/50 text-white/70 cursor-not-allowed"
              )}
            >
              {t("customize.saveDashboard")}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* ═══════ TOP ROW — KPIs pequenos ═══════ */}
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {t("customize.topRowLabel")}
            </p>
            <SortableContext items={topRowIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {topRowIds.map((id) => (
                  <FilledSlot
                    key={id}
                    id={id}
                    onRemove={() => removeWidget(id)}
                  >
                    {renderWidget(id)}
                  </FilledSlot>
                ))}

                {/* Empty top row slots */}
                {Array.from({ length: topEmptyCount }).map((_, i) => (
                  <EmptySlot
                    key={`top-empty-${i}`}
                    onClick={() => setLibraryTarget("top")}
                    className="min-h-[100px]"
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* ═══════ GRID PRINCIPAL — widgets grandes ═══════ */}
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {t("customize.mainGridLabel")}
            </p>
            <SortableContext items={mainGridIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 grid-flow-dense">
                {mainGridIds.map((id) => {
                  const def = getWidgetDef(id);
                  const { col } = def
                    ? getGridSpan(def.sqm)
                    : { col: 1 };
                  const colSpan = Math.min(col, MAIN_COLS);
                  const rowSpan = def?.gridRows ?? 1;

                  return (
                    <div
                      key={id}
                      className="min-w-0"
                      style={{
                        gridColumn: `span ${colSpan}`,
                        ...(rowSpan > 1 ? { gridRow: `span ${rowSpan}` } : {}),
                      }}
                    >
                      <FilledSlot
                        id={id}
                        onRemove={() => removeWidget(id)}
                      >
                        {renderWidget(id)}
                      </FilledSlot>
                    </div>
                  );
                })}

                {/* Empty main grid slots */}
                {Array.from({ length: mainEmptyCount }).map((_, i) => (
                  <EmptySlot
                    key={`main-empty-${i}`}
                    onClick={() => setLibraryTarget("main")}
                    className="min-h-[180px]"
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId ? (
              <DragOverlaySlot id={activeId}>
                {renderWidget(activeId)}
              </DragOverlaySlot>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ═══════ CHART LIBRARY MODAL ═══════ */}
      {libraryTarget === "top" && (
        <ChartLibraryModal
          availableIds={hiddenSmallIds}
          onInsert={insertWidget}
          onClose={() => setLibraryTarget(null)}
          renderWidget={renderWidget}
        />
      )}
      {libraryTarget === "main" && (
        <ChartLibraryModal
          availableIds={hiddenLargeIds}
          onInsert={insertWidget}
          onClose={() => setLibraryTarget(null)}
          renderWidget={renderWidget}
        />
      )}
    </div>
  );
}
