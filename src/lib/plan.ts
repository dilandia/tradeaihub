/**
 * Sistema de planos — TakeZ Plan
 * Helper para obter informações do plano do usuário (server-side).
 */

import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "pro" | "elite";

export type PlanInfo = {
  plan: Plan;
  billingInterval: "monthly" | "annual";
  canUseMetaApi: boolean;
  maxActiveMetaApiAccounts: number;
  maxManualAccounts: number;
  importLimitPerMonth: number;
  canUseAi: boolean;
  canUseAiCopilot: boolean;
  aiCreditsRemaining: number;
  aiCreditsPerMonth: number;
  aiCreditsPeriodEnd: string | null;
  canUseEconomicCalendar: boolean;
  canExportPdf: boolean;
  canAccessReports: boolean;
  maxTags: number;
  hasApiAccess: boolean;
};

const PLAN_LIMITS: Record<
  Plan,
  {
    canUseMetaApi: boolean;
    maxActiveMetaApiAccounts: number;
    maxManualAccounts: number;
    importLimitPerMonth: number;
    canUseAi: boolean;
    canUseAiCopilot: boolean;
    aiCreditsPerMonth: number;
    canExportPdf: boolean;
    canAccessReports: boolean;
    maxTags: number;
    hasApiAccess: boolean;
  }
> = {
  free: {
    canUseMetaApi: false,
    maxActiveMetaApiAccounts: 0,
    maxManualAccounts: 1,
    importLimitPerMonth: 5,
    canUseAi: false,
    canUseAiCopilot: false,
    aiCreditsPerMonth: 0,
    canExportPdf: false,
    canAccessReports: false,
    maxTags: 3,
    hasApiAccess: false,
  },
  pro: {
    canUseMetaApi: true,
    maxActiveMetaApiAccounts: 5,
    maxManualAccounts: 999,
    importLimitPerMonth: 999,
    canUseAi: true,
    canUseAiCopilot: false,
    aiCreditsPerMonth: 60,
    canExportPdf: true,
    canAccessReports: true,
    maxTags: 50,
    hasApiAccess: false,
  },
  elite: {
    canUseMetaApi: true,
    maxActiveMetaApiAccounts: 999,
    maxManualAccounts: 999,
    importLimitPerMonth: 999,
    canUseAi: true,
    canUseAiCopilot: true,
    aiCreditsPerMonth: 150,
    canExportPdf: true,
    canAccessReports: true,
    maxTags: 999,
    hasApiAccess: true,
  },
};

/** Obtém o plano do usuário a partir do banco (subscriptions) */
export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .single();

    if (error || !data || (data.status !== "active" && data.status !== "trialing")) {
      return "free";
    }
    const plan = data.plan as Plan;
    return ["free", "pro", "elite"].includes(plan) ? plan : "free";
  } catch {
    return "free";
  }
}

/** Obtém billing_interval do usuário */
export async function getUserBillingInterval(
  userId: string
): Promise<"monthly" | "annual"> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("billing_interval")
    .eq("user_id", userId)
    .single();

  const interval = data?.billing_interval;
  return interval === "annual" ? "annual" : "monthly";
}

/** Obtém créditos de IA restantes do usuário */
export async function getUserAiCredits(userId: string): Promise<{
  creditsRemaining: number;
  creditsUsedThisPeriod: number;
  periodEnd: string | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_credits")
    .select("credits_remaining, credits_used_this_period, period_end")
    .eq("user_id", userId)
    .single();

  return {
    creditsRemaining: data?.credits_remaining ?? 0,
    creditsUsedThisPeriod: data?.credits_used_this_period ?? 0,
    periodEnd: data?.period_end ?? null,
  };
}

/**
 * Retorna PlanInfo completo para o usuário autenticado.
 * Usar em server components ou API routes.
 */
export async function getPlanInfo(userId: string | null): Promise<PlanInfo | null> {
  if (!userId) return null;

  const [plan, billingInterval, credits] = await Promise.all([
    getUserPlan(userId),
    getUserBillingInterval(userId),
    getUserAiCredits(userId),
  ]);

  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    billingInterval,
    canUseMetaApi: limits.canUseMetaApi,
    maxActiveMetaApiAccounts: limits.maxActiveMetaApiAccounts,
    maxManualAccounts: limits.maxManualAccounts,
    importLimitPerMonth: limits.importLimitPerMonth,
    canUseAi: limits.canUseAi,
    canUseAiCopilot: limits.canUseAiCopilot,
    aiCreditsRemaining: credits.creditsRemaining,
    aiCreditsPerMonth: limits.aiCreditsPerMonth,
    aiCreditsPeriodEnd: credits.periodEnd,
    canUseEconomicCalendar: true,
    canExportPdf: limits.canExportPdf,
    canAccessReports: limits.canAccessReports,
    maxTags: limits.maxTags,
    hasApiAccess: limits.hasApiAccess,
  };
}

/** Consome créditos de IA. Retorna true se consumiu, false se sem créditos. */
export async function consumeAiCredits(
  userId: string,
  amount: number
): Promise<boolean> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("ai_credits")
    .select("credits_remaining, credits_used_this_period")
    .eq("user_id", userId)
    .single();

  const remaining = row?.credits_remaining ?? 0;
  if (remaining < amount) return false;

  const { error } = await supabase
    .from("ai_credits")
    .update({
      credits_remaining: remaining - amount,
      credits_used_this_period: (row?.credits_used_this_period ?? 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return !error;
}

/** Garante que o usuário tem registro em ai_credits e reseta período se necessário */
export async function ensureAiCreditsForPeriod(
  userId: string,
  plan: Plan
): Promise<{ creditsRemaining: number }> {
  const supabase = await createClient();
  const creditsPerMonth = PLAN_LIMITS[plan].aiCreditsPerMonth;

  const { data: existing } = await supabase
    .from("ai_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  const now = new Date();
  const periodEnd = existing?.period_end ? new Date(existing.period_end) : null;
  const needsReset = !periodEnd || periodEnd < now;

  if (!existing) {
    const periodStart = now;
    const end = new Date(periodStart);
    end.setMonth(end.getMonth() + 1);

    await supabase.from("ai_credits").insert({
      user_id: userId,
      credits_remaining: creditsPerMonth,
      credits_used_this_period: 0,
      period_start: periodStart.toISOString(),
      period_end: end.toISOString(),
    });
    return { creditsRemaining: creditsPerMonth };
  }

  if (needsReset) {
    const periodStart = now;
    const end = new Date(periodStart);
    end.setMonth(end.getMonth() + 1);

    await supabase
      .from("ai_credits")
      .update({
        credits_remaining: creditsPerMonth,
        credits_used_this_period: 0,
        period_start: periodStart.toISOString(),
        period_end: end.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);

    return { creditsRemaining: creditsPerMonth };
  }

  return { creditsRemaining: existing.credits_remaining };
}
