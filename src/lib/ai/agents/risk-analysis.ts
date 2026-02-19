import { chatCompletion } from "../client";
import { buildRiskAnalysisPrompt } from "../prompts/risk-analysis";

export type RiskAnalysisInput = {
  maxConsecutiveLosses?: number;
  maxConsecutiveLossesMoney?: number;
  equityDrawdownPct?: number;
  equityDrawdownDollar?: number;
  balanceDrawdownPct?: number;
  balanceDrawdownDollar?: number;
  avgRiskReward?: number;
  profitFactor?: number;
  totalTrades?: number;
  locale?: string;
};

export async function generateRiskAnalysis(input: RiskAnalysisInput): Promise<string> {
  const { locale, ...riskData } = input;
  const prompt = buildRiskAnalysisPrompt(riskData, locale ?? "en");
  return chatCompletion(
    [{ role: "user", content: prompt }],
    { maxTokens: 768 }
  );
}
