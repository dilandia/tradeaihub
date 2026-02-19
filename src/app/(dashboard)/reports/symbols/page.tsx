import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { SymbolsContent } from "./symbols-content";

export const metadata: Metadata = {
  title: "Symbols – Reports – TakeZ",
  description: "Análise de performance por símbolo/par.",
};

export default async function SymbolsPage({
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

  return <SymbolsContent trades={filteredTrades} />;
}
