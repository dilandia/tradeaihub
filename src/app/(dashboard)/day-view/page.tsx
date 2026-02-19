import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { DayViewContent } from "./day-view-content";

export const metadata: Metadata = {
  title: "Day View – TakeZ",
  description: "Visualização detalhada por dia de trading.",
};

export default async function DayViewPage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string; date?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;
  const initialDate = params.date ?? null;

  /* Busca trades filtrados pela conta/relatório selecionado */
  const trades = await getTrades(selectedImportId, selectedAccountId);
  const calendarTrades = toCalendarTrades(trades);

  return <DayViewContent trades={calendarTrades} initialDate={initialDate} />;
}
