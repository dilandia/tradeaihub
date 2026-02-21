import { Metadata } from "next";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { periodToDateRange } from "@/lib/date-utils";
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

  // W3-02: Server-side date filtering — push period filter to DB
  const dateRange = periodToDateRange(period);
  const trades = dateRange
    ? await getTradesByDateRange(dateRange.startDate, dateRange.endDate, selectedImportId, selectedAccountId)
    : await getTrades(selectedImportId, selectedAccountId);
  const calendarTrades = toCalendarTrades(trades);

  return <RiskContent trades={calendarTrades} />;
}
