"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  CreditCard,
  Link2,
  Settings2,
  Tags,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const USER_NAV: NavItem[] = [
  { href: "/settings/profile", labelKey: "settings.profile", icon: User },
  { href: "/settings/security", labelKey: "settings.security", icon: Shield },
  { href: "/settings/subscription", labelKey: "settings.subscription", icon: CreditCard },
];

const GENERAL_NAV: NavItem[] = [
  { href: "/settings/accounts", labelKey: "settings.accounts", icon: Link2 },
  { href: "/settings/trade-settings", labelKey: "settings.tradeSettings", icon: Settings2 },
  { href: "/settings/tags", labelKey: "settings.tags", icon: Tags },
  { href: "/settings/import-history", labelKey: "settings.importHistory", icon: Upload },
];

function NavGroup({ titleKey, items, t }: { titleKey: string; items: NavItem[]; t: (k: string) => string }) {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {t(titleKey)}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, labelKey, icon: Icon, disabled }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={disabled ? "#" : href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-score/10 text-score font-medium"
                  : disabled
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={(e) => disabled && e.preventDefault()}
              aria-disabled={disabled}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(labelKey)}
              {disabled && (
                <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t("settings.comingSoon")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function SettingsSidebar() {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile: scroll horizontal */}
      <div className="overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
        <MobileNav t={t} />
      </div>
      {/* Desktop: sidebar vertical */}
      <aside className="hidden w-56 shrink-0 border-r border-border p-4 lg:block">
        <NavGroup titleKey="settings.user" items={USER_NAV} t={t} />
        <NavGroup titleKey="settings.general" items={GENERAL_NAV} t={t} />
      </aside>
    </>
  );
}

function MobileNav({ t }: { t: (k: string) => string }) {
  const pathname = usePathname();
  const allItems = [...USER_NAV, ...GENERAL_NAV];

  return (
    <nav className="flex gap-1">
      {allItems.map(({ href, labelKey, icon: Icon, disabled }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={disabled ? "#" : href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-score/10 text-score"
                : disabled
                  ? "cursor-not-allowed text-muted-foreground/40"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={(e) => disabled && e.preventDefault()}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
