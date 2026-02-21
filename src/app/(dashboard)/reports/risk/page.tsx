import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { RiskContent } from "./risk-content";

export const metadata: Metadata = {
  title: "Risk – Reports – TakeZ",
  description: "Análise de performance por faixa de R-múltiplo.",
};

export const revalidate = 60; // ISR: Cache for 60 seconds (Wave 2)

export default async function RiskPage({
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

  return <RiskContent trades={filteredTrades} />;
}
