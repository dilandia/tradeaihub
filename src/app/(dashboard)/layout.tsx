import { Suspense } from "react";
import { cookies } from "next/headers";
import { getImportSummaries, getUserFirstName } from "@/lib/trades";
import { getUserTradingAccounts } from "@/lib/trading-accounts";
import { COOKIE_LOCALE, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/date-utils";
import { DashboardShell } from "@/components/dashboard-shell";
import { PlanHydrator } from "@/components/plan-hydrator";
import { processReferralOnFirstLogin } from "@/lib/referral-processor";
import { processAffiliateOnFirstLogin } from "@/lib/affiliate-processor";
import { createClient } from "@/lib/supabase/server";
import { getPlanInfo } from "@/lib/plan";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_LOCALE)?.value ?? DEFAULT_LOCALE) as Locale;

  /* Buscar dados compartilhados entre todas as páginas */
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [summaries, tradingAccounts, userName, planInfo] = await Promise.all([
    getImportSummaries(),
    getUserTradingAccounts(),
    getUserFirstName(),
    getPlanInfo(user?.id ?? null),
  ]);

  // Fire-and-forget: process referral code from user metadata on first login
  processReferralOnFirstLogin().catch(() => {
    /* silent — referral is non-critical */
  });

  // Fire-and-forget: process affiliate_ref cookie on first login
  if (user?.id) {
    processAffiliateOnFirstLogin(user.id).catch(() => {
      /* silent — affiliate attribution is non-critical */
    });
  }

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
      {planInfo && <PlanHydrator planInfo={planInfo} />}
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
