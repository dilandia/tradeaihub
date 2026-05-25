import { cookies } from "next/headers";
import { getServerSession } from "@/lib/get-session";
import { getImportSummaries } from "@/lib/trades";
import { getPlanInfo } from "@/lib/plan";
import { COOKIE_LOCALE, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/date-utils";
import { ImportPageContent } from "@/components/import/import-page-content";

export default async function ImportTradesPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_LOCALE)?.value ?? DEFAULT_LOCALE) as Locale;
  const { user } = await getServerSession();
  const [summaries, planInfo] = await Promise.all([
    getImportSummaries(),
    user ? getPlanInfo(user.id) : Promise.resolve(null),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const importsThisMonth = summaries.filter(
    (s) => new Date(s.created_at) >= startOfMonth
  ).length;

  const imports = summaries.map((s) => ({
    id: s.id,
    filename: s.source_filename ?? "Arquivo importado",
    tradeCount: s.imported_trades_count ?? 0,
    date: formatDate(s.created_at, locale),
  }));

  const planLimits = planInfo
    ? {
        manualAccountsCount: summaries.length,
        maxManualAccounts: planInfo.maxManualAccounts,
        importsThisMonth,
        importLimitPerMonth: planInfo.importLimitPerMonth,
      }
    : null;

  return (
    <ImportPageContent
      initialImports={imports}
      planLimits={planLimits}
    />
  );
}
