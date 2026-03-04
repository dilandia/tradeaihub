import { Metadata } from "next";
import { TradesPageContent } from "./trades-page-content";
import { getTradeWithMetaApiInfo, getTradeMetricsRpc } from "@/lib/trades";
import { getTradesPaginated } from "@/app/actions/trades-pagination";
import { getUserTags } from "@/app/actions/tags";

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
  // Fetch paginated trades, metrics, and user tags in parallel
  const [paginatedResult, metrics, userTags] = await Promise.all([
    getTradesPaginated(page, pageSize, importId || undefined, accountId || undefined),
    getTradeMetricsRpc(importId || undefined, accountId || undefined),
    getUserTags().catch((err) => {
      console.error("[trades] getUserTags failed:", err);
      return [] as Awaited<ReturnType<typeof getUserTags>>;
    }),
  ]);
  const trades = paginatedResult.data as any;

  const selectedTrade = tradeId ? await getTradeWithMetaApiInfo(tradeId) : null;

  return (
    <TradesPageContent
      trades={trades}
      metrics={metrics}
      selectedTrade={selectedTrade}
      importId={importId}
      accountId={accountId}
      pagination={paginatedResult.pagination}
      userTags={userTags}
    />
  );
}
