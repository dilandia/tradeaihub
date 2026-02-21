"use client";

import { getWidgetDef, getGridSpan, isSmallWidget } from "@/lib/widget-registry";
import { KPI_CARD_HEIGHT_PX, STANDARD_CARD_HEIGHT_PX, TOP_ROW_MAX_ITEMS } from "@/lib/dashboard-constants";
import { cn } from "@/lib/utils";

type GridItem = {
  id: string;
  children: React.ReactNode;
};

type Props = {
  items: GridItem[];
  className?: string;
};

/**
 * Dashboard grid com 2 seções:
 * 1. KPI row: máx 8 widgets (2 linhas × 4 colunas) — KPIs nunca vão para o grid principal
 * 2. Main grid: apenas charts, calendários, tabelas (placement: "main")
 */
export function DashboardGrid({ items, className }: Props) {
  const smallItems = items.filter(({ id }) => isSmallWidget(id));
  const kpiItems = smallItems.slice(0, TOP_ROW_MAX_ITEMS);
  const mainItems = items.filter(({ id }) => !isSmallWidget(id));

  return (
    <div className={cn("space-y-3", className)}>
      {/* ═══ KPI Top Row — Mobile-first: 1 col (xs), 2 cols (sm), 3 cols (md), 4 cols (lg+) ═══ */}
      {kpiItems.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6"
          style={{ gridAutoRows: `${KPI_CARD_HEIGHT_PX}px` }}
        >
          {kpiItems.map(({ id, children }) => (
            <div key={id} className="min-w-0 [&>*]:h-full">
              {children}
            </div>
          ))}
        </div>
      )}

      {/* ═══ Main Grid — Mobile-first: 1 col (xs/sm), 2 cols (md), 3 cols (lg+) ═══ */}
      {mainItems.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5 lg:gap-6 grid-flow-dense items-stretch"
          style={{ gridAutoRows: `${STANDARD_CARD_HEIGHT_PX}px` }}
        >
          {mainItems.map(({ id, children }) => {
            const def = getWidgetDef(id);
            if (!def) return null;
            const { col } = getGridSpan(def.sqm);
            const rows = def.gridRows ?? 1;
            const minHeightPx =
              rows > 1 ? rows * STANDARD_CARD_HEIGHT_PX + (rows - 1) * 12 : undefined;

            return (
              <div
                key={id}
                className={cn(
                  "min-w-0 flex flex-col",
                  rows > 1 && "[&>*]:min-h-0 [&>*]:flex-1"
                )}
                style={{
                  gridColumn: `span ${Math.min(col, 3)}`,
                  ...(rows > 1 && { gridRow: `span ${rows}`, minHeight: minHeightPx }),
                }}
              >
                {children}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
