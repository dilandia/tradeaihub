import { chatCompletion } from "../client";
import { buildPerformanceInsightsPrompt } from "../prompts/performance-insights";

export type PerformanceInsightsInput = {
  metrics: Record<string, unknown>;
  tradesCount: number;
  locale?: string;
};

export async function generatePerformanceInsights(
  input: PerformanceInsightsInput
): Promise<string> {
  const prompt = buildPerformanceInsightsPrompt(
    input.metrics,
    input.tradesCount,
    input.locale ?? "en"
  );
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 768 }
  );
}
