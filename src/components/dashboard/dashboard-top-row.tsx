"use client";

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
 * Linha superior: mesmo grid 4 colunas do grid principal.
 * Widgets com mesma proporção dos demais (~384×178).
 */
export function DashboardTopRow({ items, className }: Props) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-2 lg:grid-cols-4",
        "min-w-0 w-full",
        className
      )}
    >
      {items.map(({ id, children }) => (
        <div
          key={id}
          className="min-w-0 flex items-stretch"
        >
          {children}
        </div>
      ))}
    </div>
  );
}
