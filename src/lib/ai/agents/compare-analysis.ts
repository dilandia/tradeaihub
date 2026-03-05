import { chatCompletion } from "../client";
import { buildCompareAnalysisPrompt } from "../prompts/compare-analysis";

export type CompareAnalysisInput = {
  period1Metrics: Record<string, unknown>;
  period2Metrics: Record<string, unknown>;
  period1Label: string;
  period2Label: string;
  locale?: string;
};

export async function generateCompareAnalysis(
  input: CompareAnalysisInput
): Promise<string> {
  const prompt = buildCompareAnalysisPrompt(
    input.period1Metrics,
    input.period2Metrics,
    input.period1Label,
    input.period2Label,
    input.locale ?? "en"
  );
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 2048 }
  );
}
