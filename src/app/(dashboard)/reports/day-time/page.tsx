import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { DayTimeContent } from "./day-time-content";

export const metadata: Metadata = {
  title: "Day & Time – Reports – TakeZ",
  description: "Análise de performance por dia da semana e horário.",
};

export default async function DayTimePage({
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

  return <DayTimeContent trades={filteredTrades} />;
}
