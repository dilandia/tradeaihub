"use server"

import { getResendClient } from "@/lib/email/client"
import { welcomeEmailHtml } from "@/lib/email/templates/welcome"
import { passwordResetEmailHtml } from "@/lib/email/templates/password-reset"

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
      ? "Bem-vindo ao Trade AI Hub!"
      : "Welcome to Trade AI Hub!"

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
