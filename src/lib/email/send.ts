"use server"

import { getResendClient } from "@/lib/email/client"
import { welcomeEmailHtml } from "@/lib/email/templates/welcome"
import { passwordResetEmailHtml } from "@/lib/email/templates/password-reset"
import { tradingReportEmailHtml } from "@/lib/email/templates/trading-report"
import { paymentFailedEmailHtml } from "@/lib/email/templates/payment-failed"
import { paymentConfirmationEmailHtml } from "@/lib/email/templates/payment-confirmation"
import { upgradeConfirmedEmailHtml } from "@/lib/email/templates/upgrade-confirmed"
import { cancellationEmailHtml } from "@/lib/email/templates/cancellation"
import { importCompletedEmailHtml } from "@/lib/email/templates/import-completed"
import { creditsExhaustedEmailHtml } from "@/lib/email/templates/credits-exhausted"
import { conversionC1FeatureGateHtml } from "@/lib/email/templates/conversion-c1-feature-gate"
import { conversionC2PowerUserHtml } from "@/lib/email/templates/conversion-c2-power-user"
import { conversionC3CreditLimitHtml } from "@/lib/email/templates/conversion-c3-credit-limit"
import { conversionC4AhaMomentHtml } from "@/lib/email/templates/conversion-c4-aha-moment"
import { conversionC5Milestone30dHtml } from "@/lib/email/templates/conversion-c5-milestone-30d"
import { conversionC6ValueRecapHtml } from "@/lib/email/templates/conversion-c6-value-recap"
import { conversionC7SocialProofHtml } from "@/lib/email/templates/conversion-c7-social-proof"
import { conversionC8SpecialOfferHtml } from "@/lib/email/templates/conversion-c8-special-offer"
import { retentionR7PostCancellationHtml } from "@/lib/email/templates/retention-r7-post-cancellation"
import { retentionR8FeatureAnnouncementHtml } from "@/lib/email/templates/retention-r8-feature-announcement"
import { retentionR1MonthlyUsageHtml } from "@/lib/email/templates/retention-r1-monthly-usage"
import { retentionR2TradeMilestoneHtml } from "@/lib/email/templates/retention-r2-trade-milestone"
import { retentionR3TimeMilestoneHtml } from "@/lib/email/templates/retention-r3-time-milestone"
import { retentionR4FeatureDiscoveryHtml } from "@/lib/email/templates/retention-r4-feature-discovery"
import { retentionR5ActivityDecliningHtml } from "@/lib/email/templates/retention-r5-activity-declining"
import { retentionR6PreCancellationHtml } from "@/lib/email/templates/retention-r6-pre-cancellation"
import { winbackW1FriendlyCheckinHtml } from "@/lib/email/templates/winback-w1-friendly-checkin"
import { winbackW2ValueNewsHtml } from "@/lib/email/templates/winback-w2-value-news"
import { winbackW3LastAttemptHtml } from "@/lib/email/templates/winback-w3-last-attempt"
import { winbackW4FreeReactivationHtml } from "@/lib/email/templates/winback-w4-free-reactivation"
import { onboardingO2ImportGuideHtml } from "@/lib/email/templates/onboarding-o2-import-guide"
import { onboardingO3DiscoverInsightsHtml } from "@/lib/email/templates/onboarding-o3-discover-insights"
import { onboardingO4FirstAiAgentHtml } from "@/lib/email/templates/onboarding-o4-first-ai-agent"
import { onboardingO5StrategiesHtml } from "@/lib/email/templates/onboarding-o5-strategies"
import { onboardingO6WeekSummaryHtml } from "@/lib/email/templates/onboarding-o6-week-summary"
import { canSendEmail, recordSend } from "@/lib/email/scheduler"

/**
 * Use the verified domain sender when available.
 * Falls back to Resend's onboarding address for testing.
 */
const FROM = process.env.RESEND_FROM_EMAIL || "Trade AI Hub <onboarding@resend.dev>"

interface EmailResult {
  success: boolean
  error?: string
}

export async function sendWelcomeEmail(params: {
  to: string
  userName?: string
  locale?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping welcome email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = welcomeEmailHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Bem-vindo ao Trade AI Hub — Comece em 2 Minutos"
      : "Welcome to Trade AI Hub — Get Started in 2 Minutes"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetLink: string
  locale?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping password reset email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = passwordResetEmailHtml({
      resetLink: params.resetLink,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Redefinir sua senha — Trade AI Hub"
      : "Reset Your Password — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendTradingReportEmail(params: {
  to: string
  userName?: string
  locale?: string
  period: "weekly" | "monthly"
  startDate: string
  endDate: string
  metrics: {
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    netDollar: number
    profitFactor: number
    bestTradePnl: number
    worstTradePnl: number
    zellaScore: number
  }
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY not configured — skipping trading report email"
    )
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = tradingReportEmailHtml({
      userName: params.userName,
      locale: params.locale,
      period: params.period,
      startDate: params.startDate,
      endDate: params.endDate,
      metrics: params.metrics,
    })

    const isPt = params.locale?.startsWith("pt")
    const periodLabel = isPt
      ? params.period === "weekly"
        ? "Semanal"
        : "Mensal"
      : params.period === "weekly"
        ? "Weekly"
        : "Monthly"

    const subject = isPt
      ? `Seu Relatorio ${periodLabel} de Trading — Trade AI Hub`
      : `Your ${periodLabel} Trading Report — Trade AI Hub`

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send trading report email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendPaymentFailedEmail(params: {
  to: string
  userName?: string
  locale?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping payment failed email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = paymentFailedEmailHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Problema com seu pagamento — Trade AI Hub"
      : "Payment Failed — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send payment failed email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendPaymentConfirmationEmail(params: {
  to: string
  userName?: string
  locale?: string
  planName: string
  amountPaid: string
  nextBillingDate: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping payment confirmation email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = paymentConfirmationEmailHtml({
      userName: params.userName,
      locale: params.locale,
      planName: params.planName,
      amountPaid: params.amountPaid,
      nextBillingDate: params.nextBillingDate,
    })

    const subject = params.locale?.startsWith("pt")
      ? `Pagamento Confirmado — Plano ${params.planName}`
      : `Payment Confirmed — ${params.planName} Plan`

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "payment_confirmation").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send payment confirmation email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendUpgradeConfirmedEmail(params: {
  to: string
  userName?: string
  locale?: string
  planName: string
  nextBillingDate: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping upgrade confirmed email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = upgradeConfirmedEmailHtml({
      userName: params.userName,
      locale: params.locale,
      planName: params.planName,
      nextBillingDate: params.nextBillingDate,
    })

    const subject = params.locale?.startsWith("pt")
      ? `Upgrade Confirmado — Plano ${params.planName} Ativado!`
      : `Upgrade Confirmed — ${params.planName} Plan Activated!`

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "upgrade_confirmed").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send upgrade confirmed email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendCancellationEmail(params: {
  to: string
  userName?: string
  locale?: string
  planName: string
  accessEndDate: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping cancellation email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = cancellationEmailHtml({
      userName: params.userName,
      locale: params.locale,
      planName: params.planName,
      accessEndDate: params.accessEndDate,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Assinatura cancelada — Trade AI Hub"
      : "Subscription Cancelled — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "cancellation").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send cancellation email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendImportCompletedEmail(params: {
  to: string
  userName?: string
  locale?: string
  tradeCount: number
  accountName: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping import completed email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = importCompletedEmailHtml({
      userName: params.userName,
      locale: params.locale,
      tradeCount: params.tradeCount,
      accountName: params.accountName,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Importacao Completa — Trade AI Hub"
      : "Import Complete — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "import_completed").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send import completed email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendCreditsExhaustedEmail(params: {
  to: string
  userName?: string
  locale?: string
  currentPlan: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping credits exhausted email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const html = creditsExhaustedEmailHtml({
      userName: params.userName,
      locale: params.locale,
      currentPlan: params.currentPlan,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Creditos de IA Esgotados — Trade AI Hub"
      : "AI Credits Exhausted — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "credits_exhausted").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send credits exhausted email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendOnboardingO2Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping onboarding O2 email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (params.userId) {
      const allowed = await canSendEmail(params.userId, "onboarding_o2")
      if (!allowed) {
        return { success: false, error: "Email blocked by scheduler" }
      }
    }

    const html = onboardingO2ImportGuideHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Importe Seus Trades em 3 Passos Simples — Trade AI Hub"
      : "Import Your Trades in 3 Easy Steps — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "onboarding_o2").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send onboarding O2 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendOnboardingO3Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping onboarding O3 email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (params.userId) {
      const allowed = await canSendEmail(params.userId, "onboarding_o3")
      if (!allowed) {
        return { success: false, error: "Email blocked by scheduler" }
      }
    }

    const html = onboardingO3DiscoverInsightsHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Seus Insights de Trading com IA Estao Prontos — Trade AI Hub"
      : "Your AI Trading Insights Are Ready — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "onboarding_o3").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send onboarding O3 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendOnboardingO4Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping onboarding O4 email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (params.userId) {
      const allowed = await canSendEmail(params.userId, "onboarding_o4")
      if (!allowed) {
        return { success: false, error: "Email blocked by scheduler" }
      }
    }

    const html = onboardingO4FirstAiAgentHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Conheca Seu Coach de Trading com IA — Trade AI Hub"
      : "Meet Your AI Trading Coach — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "onboarding_o4").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send onboarding O4 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendOnboardingO5Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping onboarding O5 email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (params.userId) {
      const allowed = await canSendEmail(params.userId, "onboarding_o5")
      if (!allowed) {
        return { success: false, error: "Email blocked by scheduler" }
      }
    }

    const html = onboardingO5StrategiesHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Rastreie Suas Estrategias Como um Pro — Trade AI Hub"
      : "Track Your Strategies Like a Pro — Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "onboarding_o5").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send onboarding O5 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendOnboardingO6Email(params: {
  to: string
  userName?: string
  locale?: string
  stats?: {
    tradesAnalyzed?: number
    insightsGenerated?: number
    daysActive?: number
  }
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping onboarding O6 email")
    return { success: false, error: "Email not configured" }
  }

  try {
    if (params.userId) {
      const allowed = await canSendEmail(params.userId, "onboarding_o6")
      if (!allowed) {
        return { success: false, error: "Email blocked by scheduler" }
      }
    }

    const html = onboardingO6WeekSummaryHtml({
      userName: params.userName,
      locale: params.locale,
      stats: params.stats,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Seus Primeiros 10 Dias no Trade AI Hub"
      : "Your First 10 Days with Trade AI Hub"

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      html,
    })

    if (params.userId) {
      await recordSend(params.userId, "onboarding_o6").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send onboarding O6 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC3Email(params: {
  to: string
  userName?: string
  locale?: string
  creditsUsed: number
  creditsTotal: number
  currentPlan: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C3 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c3"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC3CreditLimitHtml({
      userName: params.userName,
      locale: params.locale,
      creditsUsed: params.creditsUsed,
      creditsTotal: params.creditsTotal,
      currentPlan: params.currentPlan,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Seus Creditos de IA Estao Acabando"
      : "Your AI Credits Are Running Low"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c3").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C3 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC1Email(params: {
  to: string
  userName?: string
  locale?: string
  featureName: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C1 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c1"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC1FeatureGateHtml({
      userName: params.userName,
      locale: params.locale,
      featureName: params.featureName,
    })

    const isPt = params.locale?.startsWith("pt")
    const subject = isPt
      ? `Desbloqueie ${params.featureName} — Trade AI Hub`
      : `Unlock ${params.featureName} — Trade AI Hub`

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c1").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C1 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC2Email(params: {
  to: string
  userName?: string
  locale?: string
  agentCount: number
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C2 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c2"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC2PowerUserHtml({
      userName: params.userName,
      locale: params.locale,
      agentCount: params.agentCount,
    })

    const isPt = params.locale?.startsWith("pt")
    const subject = isPt
      ? "Voce e um Power User! — Trade AI Hub"
      : "You're a Power User! — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c2").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C2 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC4Email(params: {
  to: string
  userName?: string
  locale?: string
  insightType: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C4 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c4"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC4AhaMomentHtml({
      userName: params.userName,
      locale: params.locale,
      insightType: params.insightType,
    })

    const isPt = params.locale?.startsWith("pt")
    const subject = isPt
      ? "Sua IA Encontrou Algo Importante — Trade AI Hub"
      : "Your AI Found Something Important — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c4").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C4 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC5Email(params: {
  to: string
  userName?: string
  locale?: string
  stats?: {
    tradesAnalyzed?: number
    insightsGenerated?: number
  }
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C5 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c5"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC5Milestone30dHtml({
      userName: params.userName,
      locale: params.locale,
      stats: params.stats,
    })

    const isPt = params.locale?.startsWith("pt")
    const subject = isPt
      ? "30 Dias de Insights de Trading — Trade AI Hub"
      : "30 Days of Trading Insights — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c5").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C5 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC6Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C6 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c6"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC6ValueRecapHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "O Que Seu Plano Free Oferece"
      : "What Your Free Plan Offers"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c6").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C6 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC7Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C7 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c7"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC7SocialProofHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Traders Estao Evoluindo"
      : "Traders Are Leveling Up"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c7").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C7 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendConversionC8Email(params: {
  to: string
  userName?: string
  locale?: string
  discountPercent?: number
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping C8 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "conversion_c8"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = conversionC8SpecialOfferHtml({
      userName: params.userName,
      locale: params.locale,
      discountPercent: params.discountPercent,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Oferta Especial — 20% Off no Plano Pro"
      : "Special Offer — 20% Off Pro Plan"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "conversion_c8").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send C8 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR7Email(params: {
  to: string
  userName?: string
  locale?: string
  accessEndDate: string
  planName: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R7 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r7"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR7PostCancellationHtml({
      userName: params.userName,
      locale: params.locale,
      accessEndDate: params.accessEndDate,
      planName: params.planName,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Sentimos Sua Falta"
      : "We're Sorry to See You Go"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r7").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R7 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR8Email(params: {
  to: string
  userName?: string
  locale?: string
  featureTitle: string
  featureDescription: string
  ctaUrl: string
  ctaText?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R8 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r8"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR8FeatureAnnouncementHtml({
      userName: params.userName,
      locale: params.locale,
      featureTitle: params.featureTitle,
      featureDescription: params.featureDescription,
      ctaUrl: params.ctaUrl,
      ctaText: params.ctaText,
    })

    const subject = params.locale?.startsWith("pt")
      ? `Novidade: ${params.featureTitle}`
      : `What's New: ${params.featureTitle}`

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r8").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R8 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR1Email(params: {
  to: string
  userName?: string
  locale?: string
  stats: {
    tradesAnalyzed: number
    aiInsights: number
    creditsUsed: number
    strategiesActive: number
    takerzScore: number
    prevScore?: number
  }
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R1 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r1"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR1MonthlyUsageHtml({
      userName: params.userName,
      locale: params.locale,
      stats: params.stats,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Seu Resumo Mensal — Trade AI Hub"
      : "Your Monthly Summary — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r1").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R1 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR2Email(params: {
  to: string
  userName?: string
  locale?: string
  milestone: number
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R2 email")
    return { success: false, error: "Email not configured" }
  }

  const dedupKey = `retention_r2_${params.milestone}`
  if (params.userId && !(await canSendEmail(params.userId, dedupKey))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR2TradeMilestoneHtml({
      userName: params.userName,
      locale: params.locale,
      milestone: params.milestone,
    })

    const subject = params.locale?.startsWith("pt")
      ? `Marco: ${params.milestone} Trades! — Trade AI Hub`
      : `Milestone: ${params.milestone} Trades! — Trade AI Hub`

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, dedupKey).catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R2 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR3Email(params: {
  to: string
  userName?: string
  locale?: string
  months: number
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R3 email")
    return { success: false, error: "Email not configured" }
  }

  const dedupKey = `retention_r3_${params.months}`
  if (params.userId && !(await canSendEmail(params.userId, dedupKey))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR3TimeMilestoneHtml({
      userName: params.userName,
      locale: params.locale,
      months: params.months,
    })

    const subject = params.locale?.startsWith("pt")
      ? `${params.months} Meses com Trade AI Hub!`
      : `${params.months} Months with Trade AI Hub!`

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, dedupKey).catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R3 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR4Email(params: {
  to: string
  userName?: string
  locale?: string
  featureName: string
  featureDescription: string
  featureUrl: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R4 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r4"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR4FeatureDiscoveryHtml({
      userName: params.userName,
      locale: params.locale,
      featureName: params.featureName,
      featureDescription: params.featureDescription,
      featureUrl: params.featureUrl,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Voce Conhece Esta Funcionalidade? — Trade AI Hub"
      : "Did You Know About This Feature? — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r4").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R4 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR5Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R5 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r5"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR5ActivityDecliningHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Seus Trades Estao Esperando — Trade AI Hub"
      : "Your Trades Are Waiting — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r5").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R5 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendRetentionR6Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping R6 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "retention_r6"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = retentionR6PreCancellationHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Antes de Ir... — Trade AI Hub"
      : "Before You Go... — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "retention_r6").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send R6 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendWinbackW1Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping W1 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "winback_w1"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = winbackW1FriendlyCheckinHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Sentimos Sua Falta — Trade AI Hub"
      : "We Miss You — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "winback_w1").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send W1 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendWinbackW2Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping W2 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "winback_w2"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = winbackW2ValueNewsHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Novidades no Trade AI Hub"
      : "What's New at Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "winback_w2").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send W2 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendWinbackW3Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping W3 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "winback_w3"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = winbackW3LastAttemptHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Ultima Mensagem — Trade AI Hub"
      : "Final Check-In — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "winback_w3").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send W3 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}

export async function sendWinbackW4Email(params: {
  to: string
  userName?: string
  locale?: string
  userId?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping W4 email")
    return { success: false, error: "Email not configured" }
  }

  if (params.userId && !(await canSendEmail(params.userId, "winback_w4"))) {
    return { success: false, error: "Email blocked by preferences or frequency cap" }
  }

  try {
    const html = winbackW4FreeReactivationHtml({
      userName: params.userName,
      locale: params.locale,
    })

    const subject = params.locale?.startsWith("pt")
      ? "Sua Conta Ainda Esta Ativa — Trade AI Hub"
      : "Your Account Is Still Active — Trade AI Hub"

    await resend.emails.send({ from: FROM, to: params.to, subject, html })

    if (params.userId) {
      await recordSend(params.userId, "winback_w4").catch(() => {})
    }

    return { success: true }
  } catch (error) {
    console.error("[Email] Failed to send W4 email:", error)
    return {
      success: false,
      error: `Failed to send: ${error instanceof Error ? error.message : "Unknown"}`,
    }
  }
}
