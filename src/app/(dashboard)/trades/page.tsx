import { Metadata } from "next";
import { TradesPageContent } from "./trades-page-content";
import { getTradeWithMetaApiInfo, getTradeMetricsRpc } from "@/lib/trades";
import { getTradesPaginated } from "@/app/actions/trades-pagination";

export const metadata: Metadata = {
  title: "Trades – TakeZ",
};

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tradeId?: string;
    import?: string;
    account?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const tradeId = params.tradeId ?? null;
  const importId = params.import ?? null;
  const accountId = params.account ?? null;
  const page = params.page ?? "1";
  const pageSize = params.pageSize ?? "20";

  // TDR-11: Use pagination for large datasets
  const paginatedResult = await getTradesPaginated(page, pageSize, importId || undefined, accountId || undefined);
  const trades = paginatedResult.data as any;

  // Wave 2: Get metrics via RPC (eliminates double-fetch of getTrades)
  const metrics = await getTradeMetricsRpc(importId || undefined, accountId || undefined);

  const selectedTrade = tradeId ? await getTradeWithMetaApiInfo(tradeId) : null;

  return (
    <TradesPageContent
      trades={trades}
      metrics={metrics}
      selectedTrade={selectedTrade}
      importId={importId}
      accountId={accountId}
      pagination={paginatedResult.pagination}
    />
  );
}
