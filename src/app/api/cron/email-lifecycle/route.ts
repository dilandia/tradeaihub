import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { processOnboardingEmails } from "@/lib/email/sequences/onboarding"
import { processConversionEmails } from "@/lib/email/sequences/conversion"
import { processRetentionEmails } from "@/lib/email/sequences/retention"
import { processWinbackEmails } from "@/lib/email/sequences/winback"

const CRON_SECRET = process.env.CRON_SECRET

function isValidCronSecret(provided: string | null): boolean {
  if (!CRON_SECRET || !provided) return false
  const a = Buffer.from(CRON_SECRET)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    phase: "sprint-complete",
  }

  try {
    // Process onboarding sequence (Sprint 2+)
    results.onboarding = await processOnboardingEmails()

    // Process conversion emails — C2, C5 (behavioral) + C6, C7, C8 (temporal)
    results.conversion = await processConversionEmails()

    // Process retention emails — R1 (monthly), R2 (trade milestones), R3 (time milestones), R5 (declining)
    results.retention = await processRetentionEmails()

    // Process win-back emails — W1 (14d), W2 (21d), W3 (30d paid), W4 (30d free)
    results.winback = await processWinbackEmails()

    return NextResponse.json({
      success: true,
      message: "Email lifecycle cron processed",
      ...results,
    })
  } catch (error) {
    console.error("[Email Lifecycle Cron] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
