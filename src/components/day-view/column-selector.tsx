"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnKey =
  | "open_time"
  | "ticker"
  | "side"
  | "instrument"
  | "net_pnl"
  | "net_roi"
  | "r_multiple"
  | "duration"
  | "entry_price"
  | "exit_price"
  | "pips"
  | "tags";

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "open_time", label: "Open time" },
  { key: "ticker", label: "Ticker" },
  { key: "side", label: "Side" },
  { key: "instrument", label: "Instrument" },
  { key: "net_pnl", label: "Net P&L" },
  { key: "net_roi", label: "Net ROI" },
  { key: "r_multiple", label: "R-Multiple" },
  { key: "duration", label: "Duration" },
  { key: "entry_price", label: "Entry Price" },
  { key: "exit_price", label: "Exit Price" },
  { key: "pips", label: "Pips" },
  { key: "tags", label: "Tags" },
];

export const DEFAULT_COLUMNS: ColumnKey[] = [
  "open_time",
  "ticker",
  "side",
  "instrument",
  "net_pnl",
  "net_roi",
  "r_multiple",
];

type Props = {
  open: boolean;
  onClose: () => void;
  columns: ColumnKey[];
  onUpdate: (cols: ColumnKey[]) => void;
};

export function ColumnSelector({ open, onClose, columns, onUpdate }: Props) {
  const [selected, setSelected] = useState<Set<ColumnKey>>(new Set(columns));

  if (!open) return null;

  function toggle(key: ColumnKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAll() {
    setSelected(new Set(ALL_COLUMNS.map((c) => c.key)));
  }
  function handleNone() {
    setSelected(new Set());
  }
  function handleDefault() {
    setSelected(new Set(DEFAULT_COLUMNS));
  }

  function handleUpdate() {
    onUpdate(ALL_COLUMNS.filter((c) => selected.has(c.key)).map((c) => c.key));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Selecionar colunas</h3>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Escolha as colunas que deseja exibir na tabela
        </p>

        {/* Quick actions */}
        <div className="mb-4 flex gap-3 text-xs">
          <button type="button" onClick={handleAll} className="font-medium text-score hover:underline">Todos</button>
          <span className="text-border">•</span>
          <button type="button" onClick={handleNone} className="font-medium text-score hover:underline">Nenhum</button>
          <span className="text-border">•</span>
          <button type="button" onClick={handleDefault} className="font-medium text-score hover:underline">Padrão</button>
        </div>

        {/* Checkbox grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_COLUMNS.map((col) => (
            <label
              key={col.key}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                selected.has(col.key)
                  ? "border-score/50 bg-score/5 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(col.key)}
                onChange={() => toggle(col.key)}
                className="h-4 w-4 rounded border-border accent-score"
              />
              {col.label}
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg bg-score px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-score/90"
          >
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
