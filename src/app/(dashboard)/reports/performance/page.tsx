import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { PerformanceContent } from "./performance-content";

export const metadata: Metadata = {
  title: "Performance – Reports – TakeZ",
  description: "Relatório de performance com gráficos e métricas detalhadas.",
};

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string; period?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;
  const period = params.period ?? "all";

  const trades = await getTrades(selectedImportId, selectedAccountId);
  const calendarTrades = toCalendarTrades(trades);
  const filteredTrades = filterByDateRange(calendarTrades, period);

  return <PerformanceContent trades={filteredTrades} />;
}
