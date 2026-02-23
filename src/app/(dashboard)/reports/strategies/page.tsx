import { Metadata } from "next";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { periodToDateRange } from "@/lib/date-utils";
import { getStrategies } from "@/app/actions/strategies";
import { StrategiesContent } from "./strategies-content";

export const metadata: Metadata = {
  title: "Strategies – Reports – TakeZ",
  description: "Análise de performance por estratégia.",
};

export const revalidate = 60; // ISR: Cache for 60 seconds (Wave 2)

export default async function StrategiesPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string; period?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;
  const period = params.period ?? "all";

  const dateRange = periodToDateRange(period);
  const [trades, strategies] = await Promise.all([
    dateRange
      ? getTradesByDateRange(dateRange.startDate, dateRange.endDate, selectedImportId, selectedAccountId)
      : getTrades(selectedImportId, selectedAccountId),
    getStrategies(),
  ]);
  const calendarTrades = toCalendarTrades(trades);

  return <StrategiesContent trades={calendarTrades} strategies={strategies} />;
}
