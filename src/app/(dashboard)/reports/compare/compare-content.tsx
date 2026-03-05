"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiAgentCard } from "@/components/ai/ai-agent-card";
import { fetchAiCompare } from "@/hooks/use-ai-api";
import { useLanguage } from "@/contexts/language-context";
import { GitCompareArrows, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type DateRange = {
  start: string;
  end: string;
};

type Preset = {
  key: string;
  labelKey: string;
  periodA: DateRange;
  periodB: DateRange;
  periodALabel: string;
  periodBLabel: string;
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildPresets(): Preset[] {
  const now = new Date();
  const today = getToday();

  // This week vs Last week
  const startOfThisWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

  // This month vs Last month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // This quarter vs Last quarter
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const startOfThisQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
  const startOfLastQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
  const endOfLastQuarter = new Date(now.getFullYear(), currentQuarter * 3, 0);

  return [
    {
      key: "week",
      labelKey: "compare.presetThisVsLastWeek",
      periodA: { start: formatDate(startOfLastWeek), end: formatDate(endOfLastWeek) },
      periodB: { start: formatDate(startOfThisWeek), end: today },
      periodALabel: "Last week",
      periodBLabel: "This week",
    },
    {
      key: "month",
      labelKey: "compare.presetThisVsLastMonth",
      periodA: { start: formatDate(startOfLastMonth), end: formatDate(endOfLastMonth) },
      periodB: { start: formatDate(startOfThisMonth), end: today },
      periodALabel: "Last month",
      periodBLabel: "This month",
    },
    {
      key: "quarter",
      labelKey: "compare.presetThisVsLastQuarter",
      periodA: { start: formatDate(startOfLastQuarter), end: formatDate(endOfLastQuarter) },
      periodB: { start: formatDate(startOfThisQuarter), end: today },
      periodALabel: "Last quarter",
      periodBLabel: "This quarter",
    },
  ];
}

export function CompareContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const importId = searchParams.get("import") ?? undefined;
  const accountId = searchParams.get("account") ?? undefined;

  const presets = useMemo(() => buildPresets(), []);

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [periodA, setPeriodA] = useState<DateRange>({ start: "", end: "" });
  const [periodB, setPeriodB] = useState<DateRange>({ start: "", end: "" });
  const [periodALabel, setPeriodALabel] = useState("");
  const [periodBLabel, setPeriodBLabel] = useState("");

  const isValid = periodA.start && periodA.end && periodB.start && periodB.end;

  const handlePreset = useCallback(
    (preset: Preset) => {
      setActivePreset(preset.key);
      setPeriodA(preset.periodA);
      setPeriodB(preset.periodB);
      setPeriodALabel(preset.periodALabel);
      setPeriodBLabel(preset.periodBLabel);
    },
    []
  );

  const handleCustomDate = useCallback(
    (
      period: "A" | "B",
      field: "start" | "end",
      value: string
    ) => {
      setActivePreset(null);
      if (period === "A") {
        setPeriodA((prev) => ({ ...prev, [field]: value }));
        setPeriodALabel("");
      } else {
        setPeriodB((prev) => ({ ...prev, [field]: value }));
        setPeriodBLabel("");
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    return fetchAiCompare({
      period1Start: periodA.start,
      period1End: periodA.end,
      period2Start: periodB.start,
      period2End: periodB.end,
      period1Label: periodALabel || `${periodA.start} to ${periodA.end}`,
      period2Label: periodBLabel || `${periodB.start} to ${periodB.end}`,
      importId,
      accountId,
      locale,
    });
  }, [periodA, periodB, periodALabel, periodBLabel, importId, accountId, locale]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {t("compare.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("compare.description")}
        </p>
      </div>

      {/* Preset buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("compare.presets")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePreset(preset)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                activePreset === preset.key
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                  : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {t(preset.labelKey)}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Date range pickers */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Period A */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                A
              </span>
              {t("compare.periodA")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label
                htmlFor="periodA-start"
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t("compare.startDate")}
              </label>
              <input
                id="periodA-start"
                type="date"
                value={periodA.start}
                onChange={(e) =>
                  handleCustomDate("A", "start", e.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label
                htmlFor="periodA-end"
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t("compare.endDate")}
              </label>
              <input
                id="periodA-end"
                type="date"
                value={periodA.end}
                onChange={(e) =>
                  handleCustomDate("A", "end", e.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Period B */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                B
              </span>
              {t("compare.periodB")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label
                htmlFor="periodB-start"
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t("compare.startDate")}
              </label>
              <input
                id="periodB-start"
                type="date"
                value={periodB.start}
                onChange={(e) =>
                  handleCustomDate("B", "start", e.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label
                htmlFor="periodB-end"
                className="mb-1 block text-xs text-muted-foreground"
              >
                {t("compare.endDate")}
              </label>
              <input
                id="periodB-end"
                type="date"
                value={periodB.end}
                onChange={(e) =>
                  handleCustomDate("B", "end", e.target.value)
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected periods summary */}
      {isValid && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">A</span>
                <span className="text-muted-foreground">{periodALabel || t("compare.periodA")}:</span>
                <span className="font-medium text-foreground">{periodA.start}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-foreground">{periodA.end}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">B</span>
                <span className="text-muted-foreground">{periodBLabel || t("compare.periodB")}:</span>
                <span className="font-medium text-foreground">{periodB.start}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-foreground">{periodB.end}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Compare Card */}
      {isValid ? (
        <AiAgentCard
          title={t("compare.aiCardTitle")}
          description={t("compare.aiCardDesc")}
          icon={<GitCompareArrows className="h-5 w-5" />}
          onGenerate={handleGenerate}
          loadingMessageKeys={[
            "common.aiComparingPeriods",
            "common.aiAnalyzingDifferences",
            "common.aiIdentifyingTrends",
          ]}
        />
      ) : (
        <Card>
          <CardContent className="flex min-h-[120px] flex-col items-center justify-center py-8">
            <GitCompareArrows className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("compare.selectPeriods")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
