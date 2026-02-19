"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Pencil,
  RefreshCw,
  Eraser,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradingAccountSafe } from "@/lib/trading-accounts";

type Props = {
  account: TradingAccountSafe;
  onEdit: () => void;
  onSync: () => void;
  onClearTrades: () => void;
  onDelete: () => void;
  isPending: boolean;
};

export function AccountActionsMenu({
  account,
  onEdit,
  onSync,
  onClearTrades,
  onDelete,
  isPending,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Fecha ao clicar fora */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
        setConfirmClear(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    {
      label: "Editar",
      icon: Pencil,
      action: () => { setOpen(false); onEdit(); },
    },
    {
      label: account.status === "syncing" ? "Sincronizando..." : "Sincronizar agora",
      icon: RefreshCw,
      action: () => { setOpen(false); onSync(); },
      disabled: isPending || account.status === "syncing",
      spin: account.status === "syncing",
    },
    {
      label: confirmClear ? "Confirmar limpeza" : "Limpar trades",
      icon: Eraser,
      action: () => {
        if (confirmClear) { setOpen(false); setConfirmClear(false); onClearTrades(); }
        else { setConfirmClear(true); }
      },
      danger: confirmClear,
    },
    {
      label: confirmDelete ? "Confirmar exclusão" : "Deletar conta",
      icon: Trash2,
      action: () => {
        if (confirmDelete) { setOpen(false); setConfirmDelete(false); onDelete(); }
        else { setConfirmDelete(true); }
      },
      danger: true,
    },
  ];

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmDelete(false);
          setConfirmClear(false);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Ações"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in-0 zoom-in-95">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-foreground hover:bg-muted",
                item.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", item.spin && "animate-spin")} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
