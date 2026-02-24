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
import { conversionC3CreditLimitHtml } from "@/lib/email/templates/conversion-c3-credit-limit"
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
