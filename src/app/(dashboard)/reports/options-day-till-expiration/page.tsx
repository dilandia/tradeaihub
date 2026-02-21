import { Metadata } from "next";
import { getTrades, toCalendarTrades } from "@/lib/trades";
import { filterByDateRange } from "@/lib/dashboard-calc";
import { OptionsDayTillExpirationContent } from "./options-day-till-expiration-content";

export const metadata: Metadata = {
  title: "Options: Days till expiration – Reports – TakeZ",
  description: "Análise de performance por dias até expiração (opções).",
};

export const revalidate = 60; // ISR: Cache for 60 seconds (Wave 2)

export default async function OptionsDayTillExpirationPage({
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

  return <OptionsDayTillExpirationContent trades={filteredTrades} />;
}
