import { Metadata } from "next";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { periodToDateRange } from "@/lib/date-utils";
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

  // W3-02: Server-side date filtering — push period filter to DB
  const dateRange = periodToDateRange(period);
  const trades = dateRange
    ? await getTradesByDateRange(dateRange.startDate, dateRange.endDate, selectedImportId, selectedAccountId)
    : await getTrades(selectedImportId, selectedAccountId);
  const calendarTrades = toCalendarTrades(trades);

  return <WinsVsLossesContent trades={calendarTrades} />;
}
