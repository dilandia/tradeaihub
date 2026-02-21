import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { WinsVsLossesContent } from "./wins-vs-losses-content";

export const metadata: Metadata = {
  title: "Wins vs Losses – Reports – TakeZ",
  description: "Comparação de desempenho entre trades vencedores e perdedores.",
};

export const revalidate = 60; // ISR: Cache for 60 seconds (Wave 2)

export default async function WinsVsLossesPage({
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

  return <WinsVsLossesContent trades={filteredTrades} />;
}
