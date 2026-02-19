import { Suspense } from "react";
import { cookies } from "next/headers";
import { getImportSummaries, getUserFirstName } from "@/lib/trades";
import { getUserTradingAccounts } from "@/lib/trading-accounts";
import { COOKIE_LOCALE, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/date-utils";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_LOCALE)?.value ?? DEFAULT_LOCALE) as Locale;

  /* Buscar dados compartilhados entre todas as páginas */
  const [summaries, tradingAccounts, userName] = await Promise.all([
    getImportSummaries(),
    getUserTradingAccounts(),
    getUserFirstName(),
  ]);

  const accounts = tradingAccounts.map((a) => ({
    id: a.id,
    name: a.account_name,
    platform: a.platform,
    broker: a.broker,
    status: a.status,
  }));

  const imports = summaries.map((s) => ({
    id: s.id,
    filename: s.source_filename ?? "Import",
    date: formatDate(s.created_at, locale),
    account: s.account_number ?? undefined,
    broker: s.broker ?? undefined,
    tradeCount: s.imported_trades_count ?? undefined,
  }));

  return (
    <Suspense fallback={<div className="h-14" />}>
      <DashboardShell
        accounts={accounts}
        imports={imports}
        userName={userName}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}
