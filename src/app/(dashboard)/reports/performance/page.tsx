import { Metadata } from "next";
import { getTrades, getTradesByDateRange, toCalendarTrades } from "@/lib/trades";
import { periodToDateRange } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import { getPrimaryMetrics } from "@/lib/account-metrics";
import { PerformanceContent } from "./performance-content";

export const metadata: Metadata = {
  title: "Performance – Reports – TakeZ",
  description: "Relatório de performance com gráficos e métricas detalhadas.",
};

export const revalidate = 60; // ISR: Cache for 60 seconds (Wave 2)

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ import?: string; account?: string; period?: string }>;
}) {
  const params = await searchParams;
  const selectedImportId = params.import ?? null;
  const selectedAccountId = params.account ?? null;
  const period = params.period ?? "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  // W3-02: Server-side date filtering — push period filter to DB
  const dateRange = periodToDateRange(period);
  const [trades, brokerMetrics] = await Promise.all([
    dateRange
      ? getTradesByDateRange(dateRange.startDate, dateRange.endDate, selectedImportId, selectedAccountId)
      : getTrades(selectedImportId, selectedAccountId),
    userId
      ? getPrimaryMetrics(userId).catch(() => null)
      : Promise.resolve(null),
  ]);
  const calendarTrades = toCalendarTrades(trades);

  return <PerformanceContent trades={calendarTrades} brokerMetrics={brokerMetrics} />;
}
