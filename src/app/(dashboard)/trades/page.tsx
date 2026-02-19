import { Metadata } from "next";
import { TradesPageContent } from "./trades-page-content";
import { getTrades, getTradeWithMetaApiInfo, computeMetrics } from "@/lib/trades";

export const metadata: Metadata = {
  title: "Trades – TakeZ",
};

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ tradeId?: string; import?: string; account?: string }>;
}) {
  const params = await searchParams;
  const tradeId = params.tradeId ?? null;
  const importId = params.import ?? null;
  const accountId = params.account ?? null;

  const trades = await getTrades(importId || undefined, accountId || undefined);
  const metrics = computeMetrics(trades);
  const selectedTrade = tradeId ? await getTradeWithMetaApiInfo(tradeId) : null;

  return (
    <TradesPageContent
      trades={trades}
      metrics={metrics}
      selectedTrade={selectedTrade}
      importId={importId}
      accountId={accountId}
    />
  );
}
