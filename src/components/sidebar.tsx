"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  ListOrdered,
  FileText,
  Target,
  Upload,
  Settings,
  Menu,
  LogOut,
  CalendarClock,
  Sparkles,
  ArrowRight,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDataSource } from "@/contexts/data-source-context";
import { useLanguage } from "@/contexts/language-context";
import { signOut } from "@/app/actions/auth";

/* Itens principais — pro: recurso premium, ai: destaque glass roxo */
const mainNavItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, pro: false, ai: false },
  { href: "/day-view", labelKey: "nav.dayView", icon: Calendar, pro: false, ai: false },
  { href: "/trades", labelKey: "nav.tradeView", icon: ListOrdered, pro: false, ai: false },
  { href: "/economic-events", labelKey: "nav.economicEvents", icon: CalendarClock, pro: false, ai: false },
  { href: "/reports", labelKey: "nav.reports", icon: FileText, pro: true, ai: false },
  { href: "/strategies", labelKey: "nav.strategies", icon: Target, pro: false, ai: false },
  { href: "/ai-hub", labelKey: "nav.aiHub", icon: Sparkles, pro: true, ai: true },
];

/* Rodapé do menu — Importar, Configurações e Sair */
const footerNavItems = [
  { href: "/import", labelKey: "nav.importTrades", icon: Upload },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
  { action: "signout" as const, labelKey: "common.logout", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selection } = useDataSource();
  const { t } = useLanguage();

  /** Constrói query string baseada na seleção de data source ativa */
  function buildHref(base: string): string {
    if (selection.type === "account" && selection.id) {
      return `${base}?account=${selection.id}`;
    }
    if (selection.type === "import" && selection.id) {
      return `${base}?import=${selection.id}`;
    }
    return base;
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label={t("common.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        aria-label={t("common.closeMenu")}
      />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="shrink-0 flex h-16 items-center gap-2 border-b border-border px-4 lg:pl-6">
          <Link
            href={buildHref("/")}
            className="text-lg font-bold text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            {t("common.appName")}
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4 lg:p-4">
          {mainNavItems.map(({ href, labelKey, icon: Icon, pro, ai }) => {
            const basePath = href.split("?")[0];
            const isActive = pathname === basePath || pathname.startsWith(basePath + "/");
            return (
              <Link
                key={href}
                href={buildHref(href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  ai && "border border-violet-500/25 bg-gradient-to-r from-violet-500/15 to-cyan-500/10 backdrop-blur-sm shadow-sm shadow-violet-500/10",
                  ai && (isActive ? "text-violet-600 dark:text-violet-400" : "text-violet-700/90 hover:from-violet-500/25 hover:to-cyan-500/15 dark:text-violet-300/90"),
                  !ai && isActive && "bg-score/10 text-score",
                  !ai && !isActive && "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="flex-1">{t(labelKey)}</span>
                {pro && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA Pro — chamada para upgrade */}
        <div className="shrink-0 px-4 pb-3">
          <Link
            href="/settings/subscription"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-amber-500/10 px-3 py-2.5",
              "text-sm font-semibold text-violet-700 dark:text-violet-300",
              "transition-all hover:from-violet-500/25 hover:to-amber-500/20 hover:border-violet-500/50"
            )}
          >
            <Crown className="h-5 w-5 shrink-0 text-amber-500" />
            <span className="flex-1">{t("nav.upgradeToPro")}</span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
          </Link>
        </div>

        {/* Rodapé: Importar, Configurações e Sair */}
        <div className="shrink-0 border-t border-border p-4">
          <nav className="flex flex-col gap-1">
            {footerNavItems.map((item) =>
              "href" in item && item.href ? (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === item.href.split("?")[0]
                      ? "bg-score/10 text-score"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              ) : (
                <form key="signout" action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                    {t(item.labelKey)}
                  </button>
                </form>
              )
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
