"use server"

import { query, queryOne } from "@/lib/db"
import { canSendEmail, recordSend } from "@/lib/email/scheduler"
import {
  sendConversionC2Email,
  sendConversionC5Email,
  sendConversionC6Email,
  sendConversionC7Email,
  sendConversionC8Email,
} from "@/lib/email/send"

// Feature launch date — only process users who signed up AFTER this date
const FEATURE_LAUNCH_DATE = "2026-02-24T00:00:00Z"

interface ConversionResult {
  processed: number
  sent: number
  skipped: number
  errors: number
}

/**
 * Process ALL cron-based conversion emails.
 * Behavioral: C2 (Power User), C5 (30-Day Milestone)
 * Temporal: C6 (Value Recap), C7 (Social Proof), C8 (Special Offer)
 * C1 and C4 are event-triggered (inline at feature gate / AI routes).
 */
export async function processConversionEmails(): Promise<ConversionResult> {
  const result: ConversionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Process behavioral conversion emails (C2, C5)
  try {
    const behavioral = await processBehavioralConversionEmails()
    result.processed += behavioral.processed
    result.sent += behavioral.sent
    result.skipped += behavioral.skipped
    result.errors += behavioral.errors
  } catch (err) {
    console.error("[Conversion] Behavioral processing error:", err)
    result.errors++
  }

  // Process temporal conversion emails (C6, C7, C8)
  try {
    const temporal = await processTemporalConversionEmails()
    result.processed += temporal.processed
    result.sent += temporal.sent
    result.skipped += temporal.skipped
    result.errors += temporal.errors
  } catch (err) {
    console.error("[Conversion] Temporal processing error:", err)
    result.errors++
  }

  return result
}

/**
 * Process behavioral conversion emails (C2: Power User, C5: 30-Day Milestone).
 */
async function processBehavioralConversionEmails(): Promise<ConversionResult> {
  const result: ConversionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // --- C2: Power Users (3+ distinct AI agents in 7 days, Free plan only) ---
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const aiEvents = await query<{ user_id: string; event_data: Record<string, unknown> }>(
      `SELECT user_id, event_data FROM user_events
       WHERE event_type = 'ai_agent_used' AND created_at >= $1`,
      [sevenDaysAgo.toISOString()]
    )

    if (aiEvents && aiEvents.length > 0) {
      // Group by user and count distinct agent types
      const userAgentMap = new Map<string, Set<string>>()
      for (const event of aiEvents) {
        const userId = event.user_id
        const agentType = (event.event_data as Record<string, unknown>)?.agent_type as string
        if (!userId || !agentType) continue
        if (!userAgentMap.has(userId)) userAgentMap.set(userId, new Set())
        userAgentMap.get(userId)!.add(agentType)
      }

      // Filter users with 3+ distinct agents
      const powerUsers = Array.from(userAgentMap.entries())
        .filter(([, agents]) => agents.size >= 3)
        .map(([userId, agents]) => ({ userId, agentCount: agents.size }))

      for (const { userId, agentCount } of powerUsers) {
        result.processed++
        try {
          const isFree = await isFreePlanUser(userId)
          if (!isFree) {
            result.skipped++
            continue
          }

          if (!(await canSendEmail(userId, "conversion_c2"))) {
            result.skipped++
            continue
          }

          const profile = await queryOne<{ email: string; name: string | null; locale: string | null }>(
            `SELECT email, name, locale FROM better_auth_user WHERE id = $1`,
            [userId]
          )

          if (!profile?.email) {
            result.skipped++
            continue
          }

          const sendResult = await sendConversionC2Email({
            to: profile.email,
            userName: profile.name || undefined,
            locale: profile.locale || undefined,
            agentCount,
            userId,
          })

          if (sendResult.success) {
            await recordSend(userId, "conversion_c2").catch(() => {})
            result.sent++
          } else {
            result.skipped++
          }
        } catch (err) {
          console.error(`[Conversion C2] Error for user ${userId}:`, err)
          result.errors++
        }
      }
    }
  } catch (err) {
    console.error("[Conversion C2] Failed to process:", err)
    result.errors++
  }

  // --- C5: 30-Day Milestone (Free plan users who signed up 29-31 days ago) ---
  try {
    const thirtyOneDaysAgo = new Date()
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31)
    const twentyNineDaysAgo = new Date()
    twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29)

    const milestoneUsers = await query<{ id: string; email: string; name: string | null; locale: string | null }>(
      `SELECT id, email, name, locale FROM better_auth_user
       WHERE created_at >= $1
         AND created_at >= $2
         AND created_at <= $3
       LIMIT 100`,
      [FEATURE_LAUNCH_DATE, thirtyOneDaysAgo.toISOString(), twentyNineDaysAgo.toISOString()]
    )

    if (milestoneUsers) {
      for (const user of milestoneUsers) {
        result.processed++
        try {
          const isFree = await isFreePlanUser(user.id)
          if (!isFree) {
            result.skipped++
            continue
          }

          if (!(await canSendEmail(user.id, "conversion_c5"))) {
            result.skipped++
            continue
          }

          const stats = await getUserMilestoneStats(user.id)

          const sendResult = await sendConversionC5Email({
            to: user.email,
            userName: user.name || undefined,
            locale: user.locale || undefined,
            stats,
            userId: user.id,
          })

          if (sendResult.success) {
            await recordSend(user.id, "conversion_c5").catch(() => {})
            result.sent++
          } else {
            result.skipped++
          }
        } catch (err) {
          console.error(`[Conversion C5] Error for user ${user.id}:`, err)
          result.errors++
        }
      }
    }
  } catch (err) {
    console.error("[Conversion C5] Failed to process:", err)
    result.errors++
  }

  return result
}

async function getUserMilestoneStats(
  userId: string
): Promise<{ tradesAnalyzed?: number; insightsGenerated?: number } | undefined> {
  try {
    const [tradeRow, aiRow] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM trades WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM user_events
         WHERE user_id = $1 AND event_type = 'ai_agent_used'`,
        [userId]
      ),
    ])

    const tradeCount = parseInt(tradeRow?.count ?? "0", 10)
    const aiCount = parseInt(aiRow?.count ?? "0", 10)

    if (!tradeCount && !aiCount) return undefined

    return {
      tradesAnalyzed: tradeCount,
      insightsGenerated: aiCount,
    }
  } catch {
    return undefined
  }
}

/**
 * Process temporal conversion emails (C6, C7, C8) for Free plan users.
 * C6: Day 14 — Free plan value recap
 * C7: Day 21 — Social proof
 * C8: Day 30 — Special offer (20% off)
 *
 * Called by the email-lifecycle cron every 1-2 hours.
 */
export async function processTemporalConversionEmails(): Promise<ConversionResult> {
  const result: ConversionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get Free plan users who signed up 13-31 days ago (covers C6 at 14d, C7 at 21d, C8 at 30d)
  const thirtyOneDaysAgo = new Date()
  thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31)

  const thirteenDaysAgo = new Date()
  thirteenDaysAgo.setDate(thirteenDaysAgo.getDate() - 13)

  const users = await query<{ id: string; email: string; name: string | null; created_at: string }>(
    `SELECT id, email, name, created_at FROM better_auth_user
     WHERE created_at >= $1
       AND created_at >= $2
       AND created_at <= $3
     LIMIT 200`,
    [FEATURE_LAUNCH_DATE, thirtyOneDaysAgo.toISOString(), thirteenDaysAgo.toISOString()]
  )

  if (!users || users.length === 0) {
    console.error("[Conversion] Failed to fetch users or none found")
    return result
  }

  for (const user of users) {
    result.processed++
    try {
      // Check if user is still on Free plan (no active subscription)
      const isFree = await isFreePlanUser(user.id)
      if (!isFree) {
        result.skipped++
        continue
      }

      const sent = await processUserConversion(
        user.id,
        user.email,
        user.name,
        new Date(user.created_at)
      )
      if (sent) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Conversion] Error for user ${user.id}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * Check if a user is on the Free plan (no active subscription).
 */
async function isFreePlanUser(userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM subscriptions
     WHERE user_id = $1 AND status IN ('active', 'trialing')
     LIMIT 1`,
    [userId]
  )
  return !row
}

/**
 * Determine and send the next temporal conversion email for a user.
 * Returns true if an email was sent.
 */
async function processUserConversion(
  userId: string,
  email: string,
  fullName: string | null,
  signupDate: Date
): Promise<boolean> {
  const now = new Date()
  const daysSinceSignup = Math.floor(
    (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const params = { to: email, userName: fullName || undefined, userId }

  // C6: Day 14 (window: 14-20)
  if (daysSinceSignup >= 14 && daysSinceSignup <= 20) {
    if (await canSendEmail(userId, "conversion_c6")) {
      const res = await sendConversionC6Email(params)
      return res.success
    }
  }

  // C7: Day 21 (window: 21-29)
  if (daysSinceSignup >= 21 && daysSinceSignup <= 29) {
    if (await canSendEmail(userId, "conversion_c7")) {
      const res = await sendConversionC7Email(params)
      return res.success
    }
  }

  // C8: Day 30 (window: 30-37)
  if (daysSinceSignup >= 30 && daysSinceSignup <= 37) {
    if (await canSendEmail(userId, "conversion_c8")) {
      const res = await sendConversionC8Email(params)
      return res.success
    }
  }

  return false
}
