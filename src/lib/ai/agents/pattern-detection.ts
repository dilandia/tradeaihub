import { chatCompletion } from "../client";
import { buildPatternDetectionPrompt } from "../prompts/pattern-detection";

export type PatternData = {
  byDayOfWeek?: Record<string, { wins: number; total: number; pnl: number }>;
  byHour?: Record<string, { wins: number; total: number }>;
  byPair?: Record<string, { wins: number; total: number; pnl: number }>;
};

export type PatternDetectionInput = {
  patterns: PatternData;
  locale?: string;
};

export async function generatePatternInsights(
  input: PatternDetectionInput
): Promise<string> {
  const prompt = buildPatternDetectionPrompt(
    input.patterns,
    input.locale ?? "en"
  );
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 768 }
  );
}
