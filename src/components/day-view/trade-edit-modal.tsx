"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Crosshair, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { updateTradeNotesAndTags } from "@/app/actions/trades";
import { TagAutocomplete } from "@/components/trades/tag-autocomplete";
import { StrategySelector } from "@/components/trades/strategy-selector";
import { formatTimeWithUserTimezone } from "@/lib/timezone-utils";
import { useUserTimezone } from "@/hooks/use-user-timezone";
import type { CalendarTrade } from "@/lib/calendar-utils";
import type { Strategy } from "@/app/actions/strategies";
import type { UserTag } from "@/app/actions/tags";

interface TradeEditModalProps {
  open: boolean;
  onClose: () => void;
  trade: CalendarTrade;
  strategies: Strategy[];
  userTags: UserTag[];
}

export function TradeEditModal({ open, onClose, trade, strategies, userTags }: TradeEditModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const userTimezone = useUserTimezone();
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [tags, setTags] = useState<string[]>(trade.tags ?? []);
  const [strategyId, setStrategyId] = useState<string | null>(trade.strategy_id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const result = await updateTradeNotesAndTags(
      trade.id,
      notes || null,
      tags,
      strategyId
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }, [trade.id, notes, tags, strategyId, router, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t("dayView.editTrade")}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {trade.pair} &middot; {formatTimeWithUserTimezone(trade.entry_time ?? trade.time, trade.date, userTimezone)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 px-5 py-4">
                {/* Notes */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {t("trades.notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("trades.tradeNote")}
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Tag className="h-3.5 w-3.5" />
                    {t("trades.addTag")}
                  </label>
                  <TagAutocomplete
                    tags={tags}
                    onTagsChange={setTags}
                    userTags={userTags}
                  />
                </div>

                {/* Strategy */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Crosshair className="h-3.5 w-3.5" />
                    {t("trades.strategy")}
                  </label>
                  <StrategySelector
                    value={strategyId}
                    onChange={setStrategyId}
                    strategies={strategies}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-loss">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
                    saving && "opacity-50"
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? t("trades.saving") : t("trades.save")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
