import { chatCompletion } from "../client";
import { buildReportSummaryPrompt } from "../prompts/report-summary";

export type ReportSummaryInput = {
  reportType: string;
  metrics: Record<string, unknown>;
  tradesSummary: { totalTrades: number; wins: number; netPnl: number; hasDollar: boolean };
  locale?: string;
};

export async function generateReportSummary(input: ReportSummaryInput): Promise<string> {
  const prompt = buildReportSummaryPrompt(
    input.reportType,
    input.metrics,
    input.tradesSummary,
    input.locale ?? "en"
  );
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 512 }
  );
}
