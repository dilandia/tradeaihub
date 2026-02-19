import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { OverviewContent } from "./overview-content";

export const metadata: Metadata = {
  title: "Overview – Reports – TakeZ",
  description: "Visão geral dos relatórios de trading.",
};

export default async function OverviewPage({
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

  return <OverviewContent trades={filteredTrades} />;
}
