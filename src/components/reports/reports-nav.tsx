"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useDataSource } from "@/contexts/data-source-context";
import { useLanguage } from "@/contexts/language-context";
import { DateRangeButton } from "@/components/dashboard/dashboard-filters";
import {
  BarChart3,
  ChevronDown,
  Clock,
  Hash,
  Tag,
  Target,
  TrendingUp,
  Calendar,
  LayoutDashboard,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_TABS: Array<{
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  badgeKey?: string;
}> = [
  { href: "/reports/performance", labelKey: "reports.performance", icon: LayoutDashboard, badgeKey: "reports.new" },
  { href: "/reports/overview", labelKey: "reports.overview", icon: BarChart3 },
  { href: "/reports/compare", labelKey: "reports.compare", icon: GitCompare },
  { href: "/reports/calendar", labelKey: "reports.calendar", icon: Calendar },
];

const REPORT_ITEMS = [
  { href: "/reports/day-time", labelKey: "reports.dayTime", icon: Clock },
  { href: "/reports/symbols", labelKey: "reports.symbols", icon: Hash },
  { href: "/reports/risk", labelKey: "reports.risk", icon: Target },
  { href: "/reports/strategies", labelKey: "reports.strategies", icon: BarChart3 },
  { href: "/reports/tags", labelKey: "reports.tags", icon: Tag },
  { href: "/reports/options-day-till-expiration", labelKey: "reports.optionsDaysTillExpiration", icon: Calendar },
  { href: "/reports/wins-vs-losses", labelKey: "reports.winsVsLosses", icon: TrendingUp },
] as const;

export function ReportsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selection } = useDataSource();
  const { t } = useLanguage();
  const [reportsOpen, setReportsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const period = searchParams.get("period") ?? "all";

  function handlePeriodChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("period");
    else params.set("period", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    if (!reportsOpen) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setReportsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [reportsOpen]);

  function buildHref(base: string): string {
    const params = new URLSearchParams(searchParams.toString());
    // Preserva import/account da URL ou do contexto
    const importId = params.get("import") ?? (selection.type === "import" ? selection.id : null);
    const accountId = params.get("account") ?? (selection.type === "account" ? selection.id : null);
    params.delete("import");
    params.delete("account");
    params.delete("period");
    if (accountId) params.set("account", accountId);
    else if (importId) params.set("import", importId);
    if (period !== "all") params.set("period", period);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  const currentReport = REPORT_ITEMS.find((r) => pathname.startsWith(r.href));
  const isInReportsDropdown = currentReport != null;
  const reportsLabel = isInReportsDropdown ? t(currentReport.labelKey) : t("reports.title");

  return (
    <div className="border-b border-border bg-card/50">
      <div className="flex flex-wrap items-center justify-between gap-1 px-4 py-2">
        <div className="flex flex-wrap items-center gap-1">
        {MAIN_TABS.map(({ href, labelKey, icon: Icon, badgeKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={buildHref(href)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-score/10 text-score"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
              {badgeKey && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {t(badgeKey)}
                </span>
              )}
            </Link>
          );
        })}

        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setReportsOpen(!reportsOpen)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isInReportsDropdown
                ? "bg-score/10 text-score"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {reportsLabel}
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">
              Pro
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", reportsOpen && "rotate-180")} />
          </button>

          {reportsOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
              {REPORT_ITEMS.map(({ href, labelKey, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={buildHref(href)}
                    onClick={() => setReportsOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-score/10 text-score font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        </div>

        <DateRangeButton value={period} onChange={handlePeriodChange} />
      </div>
    </div>
  );
}
