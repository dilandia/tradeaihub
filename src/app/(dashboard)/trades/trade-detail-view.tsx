"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import type { DbTrade, TradeWithMetaApi } from "@/lib/trades";
import { updateTradeNotesAndTags } from "@/app/actions/trades";
import { ArrowLeft, Tag, Save, Loader2 } from "lucide-react";
import { TradeChartLightweight } from "@/components/trades/trade-chart-lightweight";
import { TradeRunningPnlChart } from "@/components/trades/trade-running-pnl-chart";

interface TradeDetailViewProps {
  trade: TradeWithMetaApi;
  importId: string | null;
  accountId: string | null;
}

type BarData = { time: number; open: number; high: number; low: number; close: number };

function buildListUrl(importId: string | null, accountId: string | null) {
  const params = new URLSearchParams();
  if (importId) params.set("import", importId);
  if (accountId) params.set("account", accountId);
  const qs = params.toString();
  return qs ? `/trades?${qs}` : "/trades";
}

/** Infere LONG/SHORT: price subiu e ganhou = LONG; price caiu e ganhou = SHORT */
function inferIsLong(trade: DbTrade): boolean {
  const entry = Number(trade.entry_price);
  const exit = Number(trade.exit_price);
  return (exit > entry) === trade.is_win;
}

export function TradeDetailView({ trade, importId, accountId }: TradeDetailViewProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [tags, setTags] = useState<string[]>(trade.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningPnlBars, setRunningPnlBars] = useState<{
    bars: BarData[];
    entryTs: number;
    exitTs: number;
  } | null>(null);

  const pnl = trade.profit_dollar != null ? Number(trade.profit_dollar) : Number(trade.pips);
  const hasDollar = trade.profit_dollar != null;
  const isLong = inferIsLong(trade);
  const side = isLong ? "LONG" : "SHORT";

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateTradeNotesAndTags(trade.id, notes || null, tags);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }, [trade.id, notes, tags, router]);

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) {
      setTags([...tags, v]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((x) => x !== tag));
  };

  const handleBarsLoaded = useCallback((bars: BarData[], entryTs: number, exitTs: number) => {
    setRunningPnlBars({ bars, entryTs, exitTs });
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar esquerda - informações do trade */}
      <aside className="w-full shrink-0 space-y-4 lg:w-80">
        <Link
          href={buildListUrl(importId, accountId)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("trades.backToList")}
        </Link>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("trades.netPnl")}</p>
              <p className={cn("text-xl font-bold", trade.is_win ? "text-profit" : "text-loss")}>
                {hasDollar
                  ? `${pnl >= 0 ? "+" : ""}$${pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)} pips`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.side")}</p>
                <p className="font-medium">{side}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.symbol")}</p>
                <p className="font-medium">{trade.pair}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.pips")}</p>
                <p className="font-medium">{Math.abs(Number(trade.pips)).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.entryPrice")}</p>
                <p className="font-medium">${Number(trade.entry_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.exitPrice")}</p>
                <p className="font-medium">${Number(trade.exit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("trades.grossPnl")}</p>
                <p className={cn("font-medium", trade.is_win ? "text-profit" : "text-loss")}>
                  {hasDollar ? `$${pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : `${pnl.toFixed(1)} pips`}
                </p>
              </div>
            </div>

            {trade.entry_time && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">{t("trades.entryExit")}</p>
                <p className="font-medium">
                  {trade.entry_time.slice(0, 5)} → {trade.exit_time?.slice(0, 5) ?? "—"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Área principal: Chart, Notes e Running P&L na mesma página */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Gráfico de candlesticks */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="mb-4 text-sm font-medium text-foreground">
              {trade.pair} — {t("trades.side")} {side}
            </h3>
            <div className="w-full">
              <TradeChartLightweight
                trade={trade}
                metaapiAccountId={trade.metaapi_account_id ?? undefined}
                onBarsLoaded={handleBarsLoaded}
              />
            </div>
          </CardContent>
        </Card>

        {/* Running P&L - desenrolar do trade */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 text-sm font-medium">{t("trades.runningPnl")}</h3>
            {runningPnlBars ? (
              <TradeRunningPnlChart
                bars={runningPnlBars.bars}
                entryTs={runningPnlBars.entryTs}
                exitTs={runningPnlBars.exitTs}
                entryPrice={Number(trade.entry_price)}
                exitPrice={Number(trade.exit_price)}
                profitDollar={pnl}
                isLong={isLong}
                hasDollar={hasDollar}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 text-sm text-muted-foreground">
                {t("common.loading")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes e Tags */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              {t("trades.notes")}
              <span className="text-xs font-normal text-muted-foreground">
                ({t("trades.tradeNote")})
              </span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("trades.tradeNote")}
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={4}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              {t("trades.addTag")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Remover ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder={t("trades.selectTag")}
                  className="h-7 w-32 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-input bg-background px-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  +
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-2">{saving ? t("trades.saving") : t("trades.save")}</span>
          </button>
          {error && <p className="text-sm text-loss">{error}</p>}
        </div>
      </div>
    </div>
  );
}
