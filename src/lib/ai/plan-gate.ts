/**
 * Gate de plano para rotas de IA.
 * Verifica se o usuário pode usar IA. Créditos são consumidos APÓS a resposta do agente.
 */

import { getPlanInfo, getUserAiCredits, consumeAiCredits, ensureAiCreditsForPeriod } from "@/lib/plan";
import { trackEvent } from "@/lib/email/events";
import { sendCreditsExhaustedEmail, sendConversionC1Email } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

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
    // C1: Feature gate hit — fire-and-forget email to Free users
    fireFeatureGateEmail(userId, "AI Analysis").catch(() => {});
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
    // C1: Feature gate hit — fire-and-forget email to non-Elite users
    fireFeatureGateEmail(userId, "AI Copilot").catch(() => {});
    return { ok: false, error: "planErrors.aiCopilotElite", code: "plan" };
  }

  await ensureAiCreditsForPeriod(userId, planInfo.plan);

  if (planInfo.aiCreditsRemaining < CREDITS_PER_COPILOT_MESSAGE) {
    return { ok: false, error: "planErrors.creditsZero", code: "credits" };
  }

  return { ok: true };
}

/**
 * After consuming credits, check thresholds and fire events/emails.
 * Fire-and-forget — never blocks the main flow.
 */
async function checkCreditThresholds(userId: string): Promise<void> {
  try {
    const { creditsRemaining, creditsUsedThisPeriod } = await getUserAiCredits(userId)
    const totalCredits = creditsUsedThisPeriod + creditsRemaining
    const usagePercent = totalCredits > 0 ? (creditsUsedThisPeriod / totalCredits) * 100 : 0

    if (creditsRemaining <= 0) {
      trackEvent(userId, "credits_exhausted").catch(() => {})

      const supabase = createAdminClient()
      const [{ data: profile }, { data: sub }] = await Promise.all([
        supabase.from("profiles").select("email, full_name, locale").eq("id", userId).single(),
        supabase.from("subscriptions").select("plan").eq("user_id", userId).single(),
      ])

      if (profile?.email) {
        sendCreditsExhaustedEmail({
          to: profile.email,
          userName: profile.full_name || undefined,
          locale: profile.locale || undefined,
          currentPlan: sub?.plan || "free",
          userId,
        }).catch(() => {})
      }
    } else if (usagePercent >= 80) {
      trackEvent(userId, "credit_limit_80").catch(() => {})
    }
  } catch {
    // Non-blocking — silently ignore threshold check failures
  }
}

/** Consome créditos após mensagem do Copilot. */
export async function consumeCopilotCreditsAfterSuccess(userId: string): Promise<void> {
  const result = await consumeAiCredits(userId, CREDITS_PER_COPILOT_MESSAGE);
  if (result.success) {
    checkCreditThresholds(userId).catch(() => {})
  }
}

/** Consome créditos após análise bem-sucedida. Chamar só depois de receber a resposta do agente. */
export async function consumeCreditsAfterSuccess(userId: string): Promise<void> {
  const result = await consumeAiCredits(userId, CREDITS_PER_ANALYSIS);
  if (result.success) {
    checkCreditThresholds(userId).catch(() => {})
  }
}

/**
 * C1: Fire feature gate email when a Free user hits a plan restriction.
 * Fire-and-forget — never blocks the calling function.
 */
async function fireFeatureGateEmail(userId: string, featureName: string): Promise<void> {
  try {
    trackEvent(userId, "feature_gate_hit", { feature: featureName }).catch(() => {})

    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, locale")
      .eq("id", userId)
      .single()

    if (profile?.email) {
      sendConversionC1Email({
        to: profile.email,
        userName: profile.full_name || undefined,
        locale: profile.locale || undefined,
        featureName,
        userId,
      }).catch(() => {})
    }
  } catch {
    // Non-blocking — silently ignore feature gate email failures
  }
}
