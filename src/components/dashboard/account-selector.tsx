"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type AccountOption = {
  id: string;
  name: string;
  platform: string;
  broker: string;
  status: string;
};

type Props = {
  accounts: AccountOption[];
  activeAccountId: string | null; // null = "All accounts"
  onChange: (accountId: string | null) => void;
};

const STATUS_COLOR: Record<string, string> = {
  connected: "bg-emerald-500",
  syncing: "bg-amber-500 animate-pulse",
  error: "bg-red-500",
  disconnected: "bg-zinc-500",
};

export function AccountSelector({ accounts, activeAccountId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  if (accounts.length === 0) return null;

  const active = activeAccountId
    ? accounts.find((a) => a.id === activeAccountId)
    : null;
  const label = active ? active.name : "Todas as contas";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3",
          "text-sm font-medium text-foreground transition-colors",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-score focus:ring-offset-2 focus:ring-offset-background"
        )}
        aria-expanded={open}
        aria-label="Selecionar conta"
      >
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline max-w-[140px] truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* All accounts */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
              activeAccountId == null
                ? "bg-score/10 text-score font-medium"
                : "text-foreground hover:bg-muted"
            )}
          >
            Todas as contas
            {activeAccountId == null && <Check />}
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-border" />

          {/* Accounts */}
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                onChange(a.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                activeAccountId === a.id
                  ? "bg-score/10 text-score font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  STATUS_COLOR[a.status] ?? "bg-zinc-500"
                )}
              />
              <span className="flex-1 truncate text-left">{a.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {a.platform}
              </span>
              {activeAccountId === a.id && <Check />}
            </button>
          ))}

          {/* Manage */}
          <div className="mt-1 border-t border-border pt-1">
            <Link
              href="/settings/accounts"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Gerenciar contas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Check() {
  return (
    <svg
      className="ml-auto h-4 w-4 text-score shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
