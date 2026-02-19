"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Database,
  Link2,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { useLanguage } from "@/contexts/language-context";

/* ─── Types ─── */

export type LinkedAccount = {
  id: string;
  name: string;
  platform: string;
  broker: string;
  status: string;
};

export type ImportReport = {
  id: string;
  filename: string;
  date: string;
  account?: string;
  broker?: string;
  tradeCount?: number;
};

export type DataSourceSelection = {
  type: "all" | "account" | "import";
  id: string | null;
};

type Props = {
  accounts: LinkedAccount[];
  imports: ImportReport[];
  selection: DataSourceSelection;
  onChange: (sel: DataSourceSelection) => void;
};

/* ─── Status colors ─── */

const STATUS_COLOR: Record<string, string> = {
  connected: "bg-emerald-500",
  syncing: "bg-amber-500 animate-pulse",
  error: "bg-red-500",
  disconnected: "bg-zinc-500",
};

/* ─── Component ─── */

export function DataSourceSelector({
  accounts,
  imports,
  selection,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasAccounts = accounts.length > 0;
  const hasImports = imports.length > 0;

  if (!hasAccounts && !hasImports) return null;

  /* ─── Current label ─── */
  let label = t("common.allData");
  let labelIcon: React.ReactNode = (
    <Database className="h-4 w-4 text-muted-foreground" />
  );

  if (selection.type === "account" && selection.id) {
    const acc = accounts.find((a) => a.id === selection.id);
    if (acc) {
      label = acc.name;
      labelIcon = (
        <span
          className={cn(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            STATUS_COLOR[acc.status] ?? "bg-zinc-500"
          )}
        />
      );
    }
  } else if (selection.type === "import" && selection.id) {
    const imp = imports.find((i) => i.id === selection.id);
    if (imp) {
      label = imp.filename;
      labelIcon = <FileText className="h-4 w-4 text-score" />;
    }
  }

  function select(sel: DataSourceSelection) {
    onChange(sel);
    setOpen(false);
  }

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
        aria-label={t("common.selectDataSource")}
      >
        {labelIcon}
        <span className="hidden sm:inline max-w-[200px] truncate">
          {label}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* ── All data ── */}
          <button
            type="button"
            onClick={() => select({ type: "all", id: null })}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              selection.type === "all"
                ? "bg-score/10 text-score font-medium"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Database className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{t("common.allData")}</span>
            {selection.type === "all" && <Check />}
          </button>

          {/* ── Linked Accounts ── */}
          {hasAccounts && (
            <>
              <SectionLabel icon={Link2} label={t("common.linkedAccounts")} />
              {accounts.map((a) => {
                const isActive =
                  selection.type === "account" && selection.id === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => select({ type: "account", id: a.id })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-score/10 text-score font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        STATUS_COLOR[a.status] ?? "bg-zinc-500"
                      )}
                    />
                    <span className="flex-1 truncate text-left">
                      {a.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {a.platform}
                    </span>
                    {isActive && <Check />}
                  </button>
                );
              })}
            </>
          )}

          {/* ── Imports ── */}
          {hasImports && (
            <>
              <SectionLabel icon={FileText} label={t("common.imports")} />
              {imports.map((imp) => {
                const isActive =
                  selection.type === "import" && selection.id === imp.id;
                return (
                  <button
                    key={imp.id}
                    type="button"
                    onClick={() => select({ type: "import", id: imp.id })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-score/10 text-score font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 truncate text-left">
                      <span className="block truncate">{imp.filename}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {imp.date}
                        {imp.account ? ` · ${imp.account}` : ""}
                      </span>
                    </div>
                    {isActive && <Check />}
                  </button>
                );
              })}
            </>
          )}

          {/* ── Manage ── */}
          <div className="mt-1 border-t border-border pt-1">
            <NextLink
              href="/settings/accounts"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              {t("common.manageAccounts")}
            </NextLink>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section Label ─── */

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="mx-2 mt-2 mb-1 flex items-center gap-1.5 border-t border-border pt-2">
      <Icon className="h-3 w-3 text-muted-foreground/60" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

/* ─── Check Icon ─── */

function Check() {
  return (
    <svg
      className="ml-auto h-4 w-4 shrink-0 text-score"
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
