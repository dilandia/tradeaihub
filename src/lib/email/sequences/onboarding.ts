"use server"

import { query, queryOne } from "@/lib/db"
import { canSendEmail, recordSend } from "@/lib/email/scheduler"
import { hasEvent } from "@/lib/email/events"
import {
  sendOnboardingO2Email,
  sendOnboardingO3Email,
  sendOnboardingO4Email,
  sendOnboardingO5Email,
  sendOnboardingO6Email,
} from "@/lib/email/send"

// Feature launch date — only process users who signed up AFTER this date
const FEATURE_LAUNCH_DATE = "2026-02-24T00:00:00Z"

interface OnboardingResult {
  processed: number
  sent: number
  skipped: number
  errors: number
}

/**
 * Process onboarding emails for all eligible users.
 * Called by the email-lifecycle cron every 1-2 hours.
 */
export async function processOnboardingEmails(): Promise<OnboardingResult> {
  const result: OnboardingResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get users who signed up after feature launch, within last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const users = await query<{ id: string; email: string; name: string | null; created_at: string }>(
    `SELECT id, email, name, created_at
     FROM better_auth_user
     WHERE created_at >= $1
       AND created_at >= $2
     LIMIT 100`,
    [FEATURE_LAUNCH_DATE, fourteenDaysAgo.toISOString()]
  )

  if (!users || users.length === 0) {
    console.error("[Onboarding] No eligible users found or query failed")
    return result
  }

  for (const user of users) {
    result.processed++
    try {
      const sent = await processUserOnboarding(user.id, user.email, user.name)
      if (sent) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Onboarding] Error for user ${user.id}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * Determine and send the next onboarding email for a user.
 * Returns true if an email was sent.
 */
async function processUserOnboarding(
  userId: string,
  email: string,
  fullName: string | null
): Promise<boolean> {
  const signupDate = await getUserSignupDate(userId)
  if (!signupDate) return false

  const now = new Date()
  const hoursSinceSignup = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60)

  const params = { to: email, userName: fullName || undefined, userId }

  // O2: Import Guide — 24h+ since signup, user hasn't imported yet
  if (hoursSinceSignup >= 24) {
    const hasImported = await hasEvent(userId, "import_completed")
    if (!hasImported && await canSendEmail(userId, "onboarding_o2")) {
      const result = await sendOnboardingO2Email(params)
      if (result.success) await recordSend(userId, "onboarding_o2")
      return result.success
    }
  }

  // O3: Discover Insights — 48h+ since signup, has imported but hasn't visited dashboard AI
  if (hoursSinceSignup >= 48) {
    const hasImported = await hasEvent(userId, "import_completed")
    if (hasImported && await canSendEmail(userId, "onboarding_o3")) {
      const result = await sendOnboardingO3Email(params)
      if (result.success) await recordSend(userId, "onboarding_o3")
      return result.success
    }
  }

  // O4: First AI Agent — 96h+ (4 days), hasn't used any AI agent
  if (hoursSinceSignup >= 96) {
    const hasUsedAi = await hasEvent(userId, "ai_agent_used")
    if (!hasUsedAi && await canSendEmail(userId, "onboarding_o4")) {
      const result = await sendOnboardingO4Email(params)
      if (result.success) await recordSend(userId, "onboarding_o4")
      return result.success
    }
  }

  // O5: Strategies — 168h+ (7 days), hasn't created a strategy
  if (hoursSinceSignup >= 168) {
    const hasStrategy = await hasEvent(userId, "strategy_created")
    if (!hasStrategy && await canSendEmail(userId, "onboarding_o5")) {
      const result = await sendOnboardingO5Email(params)
      if (result.success) await recordSend(userId, "onboarding_o5")
      return result.success
    }
  }

  // O6: Week Summary — 240h+ (10 days), always sent
  if (hoursSinceSignup >= 240) {
    if (await canSendEmail(userId, "onboarding_o6")) {
      // Get basic stats for the summary
      const stats = await getUserOnboardingStats(userId)
      const result = await sendOnboardingO6Email({ ...params, stats })
      if (result.success) await recordSend(userId, "onboarding_o6")
      return result.success
    }
  }

  return false
}

async function getUserSignupDate(userId: string): Promise<Date | null> {
  const row = await queryOne<{ created_at: string }>(
    `SELECT created_at FROM better_auth_user WHERE id = $1`,
    [userId]
  )
  return row?.created_at ? new Date(row.created_at) : null
}

async function getUserOnboardingStats(userId: string): Promise<{ tradesAnalyzed?: number; insightsGenerated?: number; daysActive?: number } | undefined> {
  try {
    const [tradeRow, aiRow, loginRow] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM trades WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM user_events WHERE user_id = $1 AND event_type = 'ai_agent_used'`,
        [userId]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM user_events WHERE user_id = $1 AND event_type = 'login'`,
        [userId]
      ),
    ])

    const tradeCount = parseInt(tradeRow?.count ?? "0", 10)
    const aiCount = parseInt(aiRow?.count ?? "0", 10)
    const loginCount = parseInt(loginRow?.count ?? "0", 10)

    if (!tradeCount && !aiCount) return undefined

    return {
      tradesAnalyzed: tradeCount,
      insightsGenerated: aiCount,
      daysActive: loginCount,
    }
  } catch {
    return undefined
  }
}
