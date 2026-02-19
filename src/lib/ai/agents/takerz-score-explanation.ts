import { chatCompletion } from "../client";
import { buildTakerzScorePrompt, type TakerzScoreInput } from "../prompts/takerz-score";

export async function generateTakerzScoreExplanation(input: TakerzScoreInput): Promise<string> {
  const prompt = buildTakerzScorePrompt(input);
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 4096 }
  );
}
