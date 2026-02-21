"use client";

import { useLanguage } from "@/contexts/language-context";
import type { DbTrade, Metrics, TradeWithMetaApi } from "@/lib/trades";
import { TradesListView } from "./trades-list-view";
import { TradeDetailView } from "./trade-detail-view";

type Props = {
  trades: DbTrade[];
  metrics: Metrics;
  selectedTrade: TradeWithMetaApi | null;
  importId: string | null;
  accountId: string | null;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
};

export function TradesPageContent({
  trades,
  metrics,
  selectedTrade,
  importId,
  accountId,
  pagination,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-2xl font-bold text-foreground">{t("trades.title")}</h1>

      {selectedTrade ? (
        <TradeDetailView
          trade={selectedTrade}
          importId={importId}
          accountId={accountId}
        />
      ) : (
        <TradesListView
          trades={trades}
          metrics={metrics}
          importId={importId}
          accountId={accountId}
          pagination={pagination}
        />
      )}
    </div>
  );
}
