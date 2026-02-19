"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataSource } from "@/contexts/data-source-context";
import { useLanguage } from "@/contexts/language-context";
import { usePlan } from "@/contexts/plan-context";
import {
  DataSourceSelector,
  type DataSourceSelection,
} from "@/components/dashboard/data-source-selector";
import { LanguageSelector } from "@/components/language-selector";
import { signOut } from "@/app/actions/auth";

type Props = {
  userName: string | null;
};

export function GlobalHeader({ userName }: Props) {
  const { selection, setSelection, accounts, imports } = useDataSource();
  const { t } = useLanguage();
  const { planInfo } = usePlan();
  const pathname = usePathname();

  const plan = planInfo?.plan ?? "free";
  const planLabel = t(`plans.${plan}`);
  const router = useRouter();

  const hasAnySource = accounts.length > 0 || imports.length > 0;

  /** Ao trocar data source: atualizar contexto + URL search params */
  const handleSourceChange = (sel: DataSourceSelection) => {
    setSelection(sel);

    /* Construir query params mantendo a rota atual */
    let qs = "";
    if (sel.type === "account" && sel.id) {
      qs = `?account=${sel.id}`;
    } else if (sel.type === "import" && sel.id) {
      qs = `?import=${sel.id}`;
    }
    router.push(`${pathname}${qs}`);
  };

  /* Label para o seletor atual */
  let sourceLabel = t("common.allData");
  if (selection.type === "account" && selection.id) {
    const acc = accounts.find((a) => a.id === selection.id);
    if (acc) sourceLabel = acc.name;
  } else if (selection.type === "import" && selection.id) {
    const imp = imports.find((i) => i.id === selection.id);
    if (imp) sourceLabel = imp.filename;
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-3 pl-14 pr-4 lg:pl-6 lg:pr-6">
        {/* Left: user greeting */}
        <div className="hidden flex-col lg:flex">
          <span className="text-sm font-semibold text-foreground">
            {userName ? t("common.hello", { name: userName }) : t("common.appName")}
          </span>
        </div>

        {/* Center: Current source badge */}
        {hasAnySource && selection.type !== "all" && (
          <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">{sourceLabel}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Right: Plan badge + Language + Data source selector + logout */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "hidden rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide sm:inline-block",
              plan === "elite" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
              plan === "pro" && "bg-violet-500/20 text-violet-600 dark:text-violet-400",
              plan === "free" && "bg-muted text-muted-foreground"
            )}
          >
            {planLabel}
          </span>
          <LanguageSelector />
          {hasAnySource && (
            <DataSourceSelector
              accounts={accounts}
              imports={imports}
              selection={selection}
              onChange={handleSourceChange}
            />
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("common.logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
