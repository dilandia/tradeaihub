"use client";

import { useState } from "react";
import { Plus, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { Strategy, StrategyFormData } from "@/app/actions/strategies";

/* ─── Constants ─── */

const STRATEGY_COLORS = [
  "#6366F1", // indigo
  "#7C3AED", // purple
  "#3B82F6", // blue
  "#06B6D4", // cyan
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#8B5CF6", // violet
  "#84CC16", // lime
];

const COMMON_TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"];

const COMMON_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF",
  "AUDUSD", "USDCAD", "NZDUSD", "XAUUSD",
  "GBPJPY", "EURJPY", "US30", "NAS100",
];

/* ─── Dynamic List Input ─── */

function DynamicListInput({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const val = inputValue.trim();
    if (val && !items.includes(val)) {
      onChange([...items, val]);
      setInputValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
            inputValue.trim()
              ? "bg-score/10 text-score hover:bg-score/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded-full p-0.5 text-muted-foreground hover:text-loss transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Chip Selector ─── */

function ChipSelector({
  items,
  selected,
  onChange,
  placeholder,
}: {
  items: string[];
  selected: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [customValue, setCustomValue] = useState("");

  function toggle(item: string) {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  }

  function handleAddCustom() {
    const val = customValue.trim().toUpperCase();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
      setCustomValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              selected.includes(item)
                ? "border-score bg-score/10 text-score"
                : "border-border text-muted-foreground hover:border-score/50 hover:text-foreground"
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors"
        />
        {customValue.trim() && (
          <button
            type="button"
            onClick={handleAddCustom}
            className="rounded-lg bg-score/10 px-3 py-2 text-xs text-score hover:bg-score/20 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Color Picker ─── */

function ColorPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STRATEGY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
            selected === c ? "border-white scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

/* ─── Main Form ─── */

type StrategyFormProps = {
  strategy?: Strategy;
  onSubmit: (data: StrategyFormData) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function StrategyForm({ strategy, onSubmit, onCancel, isPending }: StrategyFormProps) {
  const { t } = useLanguage();

  const [name, setName] = useState(strategy?.name ?? "");
  const [description, setDescription] = useState(strategy?.description ?? "");
  const [entryRules, setEntryRules] = useState<string[]>(strategy?.entry_rules ?? []);
  const [exitRules, setExitRules] = useState<string[]>(strategy?.exit_rules ?? []);
  const [timeframes, setTimeframes] = useState<string[]>(strategy?.timeframes ?? []);
  const [pairs, setPairs] = useState<string[]>(strategy?.pairs ?? []);
  const [riskPerTrade, setRiskPerTrade] = useState(
    strategy?.risk_per_trade != null ? String(strategy.risk_per_trade) : ""
  );
  const [color, setColor] = useState(strategy?.color ?? STRATEGY_COLORS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      entry_rules: entryRules,
      exit_rules: exitRules,
      timeframes,
      pairs,
      risk_per_trade: riskPerTrade ? Number(riskPerTrade) : null,
      color,
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.name")} *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("strategies.namePlaceholder")}
          className={inputClass}
          maxLength={60}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("strategies.descriptionPlaceholder")}
          className={cn(inputClass, "resize-none")}
          rows={2}
          maxLength={300}
        />
      </div>

      {/* Entry Rules */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.entryRules")}
        </label>
        <DynamicListInput
          items={entryRules}
          onChange={setEntryRules}
          placeholder={t("strategies.entryRulesPlaceholder")}
          addLabel={t("strategies.addRule")}
        />
      </div>

      {/* Exit Rules */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.exitRules")}
        </label>
        <DynamicListInput
          items={exitRules}
          onChange={setExitRules}
          placeholder={t("strategies.exitRulesPlaceholder")}
          addLabel={t("strategies.addRule")}
        />
      </div>

      {/* Timeframes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.timeframes")}
        </label>
        <ChipSelector
          items={COMMON_TIMEFRAMES}
          selected={timeframes}
          onChange={setTimeframes}
          placeholder={t("strategies.timeframesPlaceholder")}
        />
      </div>

      {/* Pairs */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.pairs")}
        </label>
        <ChipSelector
          items={COMMON_PAIRS}
          selected={pairs}
          onChange={setPairs}
          placeholder={t("strategies.pairsPlaceholder")}
        />
      </div>

      {/* Risk per Trade */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("strategies.riskPerTrade")}
        </label>
        <input
          type="number"
          value={riskPerTrade}
          onChange={(e) => setRiskPerTrade(e.target.value)}
          placeholder={t("strategies.riskPlaceholder")}
          className={cn(inputClass, "max-w-[200px]")}
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      {/* Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {t("strategies.color")}
        </label>
        <ColorPicker selected={color} onChange={setColor} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all",
            name.trim() && !isPending
              ? "bg-score hover:bg-score/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {strategy ? t("strategies.save") : t("strategies.create")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("strategies.cancel")}
        </button>
      </div>
    </form>
  );
}
