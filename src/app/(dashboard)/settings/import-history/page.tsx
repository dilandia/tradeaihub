import { Metadata } from "next";
import { cookies } from "next/headers";
import { getImportSummaries } from "@/lib/trades";
import { COOKIE_LOCALE, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/date-utils";
import { ImportHistorySection } from "@/components/settings/import-history-section";

export const metadata: Metadata = {
  title: "Histórico de Importação – TakeZ",
};

export default async function ImportHistoryPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get(COOKIE_LOCALE)?.value ?? DEFAULT_LOCALE) as Locale;
  const summaries = await getImportSummaries();

  const imports = summaries.map((s) => ({
    id: s.id,
    filename: s.source_filename ?? "Arquivo importado",
    tradeCount: s.imported_trades_count ?? 0,
    date: formatDate(s.created_at, locale),
    createdAt: s.created_at,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Histórico de importação
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualize e gerencie seus relatórios importados do MetaTrader.
        </p>
      </div>
      <ImportHistorySection imports={imports} />
    </div>
  );
}
