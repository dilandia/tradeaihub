/**
 * Gate de plano para rotas de IA.
 * Verifica se o usuário pode usar IA. Créditos são consumidos APÓS a resposta do agente.
 */

import { getPlanInfo, consumeAiCredits, ensureAiCreditsForPeriod } from "@/lib/plan";

export const CREDITS_PER_ANALYSIS = 1;
export const CREDITS_PER_COPILOT_MESSAGE = 2;

export type AiGateResult =
  | { ok: true }
  | { ok: false; error: string; code: "plan" | "credits" };

/** Apenas verifica se pode usar IA (não consome créditos). */
export async function checkAiCredits(userId: string): Promise<AiGateResult> {
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

  return { ok: true };
}

/** Verifica se pode usar AI Copilot (apenas Elite). */
export async function checkAiCopilotCredits(userId: string): Promise<AiGateResult> {
  const planInfo = await getPlanInfo(userId);
  if (!planInfo) {
    return { ok: false, error: "planErrors.aiCopilotElite", code: "plan" };
  }
  if (!planInfo.canUseAiCopilot) {
    return { ok: false, error: "planErrors.aiCopilotElite", code: "plan" };
  }

  await ensureAiCreditsForPeriod(userId, planInfo.plan);

  if (planInfo.aiCreditsRemaining < CREDITS_PER_COPILOT_MESSAGE) {
    return { ok: false, error: "planErrors.creditsZero", code: "credits" };
  }

  return { ok: true };
}

/** Consome créditos após mensagem do Copilot. */
export async function consumeCopilotCreditsAfterSuccess(userId: string): Promise<void> {
  await consumeAiCredits(userId, CREDITS_PER_COPILOT_MESSAGE);
}

/** Consome créditos após análise bem-sucedida. Chamar só depois de receber a resposta do agente. */
export async function consumeCreditsAfterSuccess(userId: string): Promise<void> {
  await consumeAiCredits(userId, CREDITS_PER_ANALYSIS);
}
