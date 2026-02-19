/**
 * Gate de plano para rotas de IA.
 * Verifica se o usuário pode usar IA e consome créditos.
 */

import { getPlanInfo, consumeAiCredits, ensureAiCreditsForPeriod } from "@/lib/plan";

const CREDITS_PER_ANALYSIS = 2;

export type AiGateResult =
  | { ok: true }
  | { ok: false; error: string; code: "plan" | "credits" };

export async function checkAndConsumeAiCredits(userId: string): Promise<AiGateResult> {
  const planInfo = await getPlanInfo(userId);
  if (!planInfo) {
    return { ok: false, error: "planErrors.aiFree", code: "plan" };
  }
  if (!planInfo.canUseAi) {
    return { ok: false, error: "planErrors.aiFree", code: "plan" };
  }

  await ensureAiCreditsForPeriod(userId, planInfo.plan);

  if (planInfo.aiCreditsRemaining < CREDITS_PER_ANALYSIS) {
    return { ok: false, error: "planErrors.creditsZero", code: "credits" };
  }

  const consumed = await consumeAiCredits(userId, CREDITS_PER_ANALYSIS);
  if (!consumed) {
    return { ok: false, error: "planErrors.creditsZero", code: "credits" };
  }

  return { ok: true };
}
