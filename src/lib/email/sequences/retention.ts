"use server"

import { query, queryOne } from "@/lib/db"
import { canSendEmail } from "@/lib/email/scheduler"
import {
  sendRetentionR1Email,
  sendRetentionR2Email,
  sendRetentionR3Email,
  sendRetentionR5Email,
} from "@/lib/email/send"

// Feature launch date — only process users who signed up AFTER this date
const FEATURE_LAUNCH_DATE = "2026-02-24T00:00:00Z"

// Trade milestones to check
const TRADE_MILESTONES = [100, 500, 1000, 5000]

// Time milestones in months
const TIME_MILESTONES = [3, 6, 12]

interface RetentionResult {
  processed: number
  sent: number
  skipped: number
  errors: number
}

/**
 * Process ALL cron-based retention emails.
 * R1: Monthly Usage Report (1st of month)
 * R2: Trade Milestones (100/500/1000/5000)
 * R3: Time Milestones (3/6/12 months)
 * R5: Activity Declining (7+ days inactive paid users)
 * R4 is event-triggered (feature discovery — sent inline).
 * R6 is event-triggered (cancellation page visit).
 */
export async function processRetentionEmails(): Promise<RetentionResult> {
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    // R1: Monthly Usage Report — only on 1st of the month
    const today = new Date()
    if (today.getDate() === 1) {
      const r1 = await processR1MonthlyUsage()
      result.processed += r1.processed
      result.sent += r1.sent
      result.skipped += r1.skipped
      result.errors += r1.errors
    }
  } catch (err) {
    console.error("[Retention] R1 processing error:", err)
    result.errors++
  }

  try {
    const r2 = await processR2TradeMilestones()
    result.processed += r2.processed
    result.sent += r2.sent
    result.skipped += r2.skipped
    result.errors += r2.errors
  } catch (err) {
    console.error("[Retention] R2 processing error:", err)
    result.errors++
  }

  try {
    const r3 = await processR3TimeMilestones()
    result.processed += r3.processed
    result.sent += r3.sent
    result.skipped += r3.skipped
    result.errors += r3.errors
  } catch (err) {
    console.error("[Retention] R3 processing error:", err)
    result.errors++
  }

  try {
    const r5 = await processR5ActivityDeclining()
    result.processed += r5.processed
    result.sent += r5.sent
    result.skipped += r5.skipped
    result.errors += r5.errors
  } catch (err) {
    console.error("[Retention] R5 processing error:", err)
    result.errors++
  }

  return result
}

/**
 * R1: Monthly Usage Report for paid users.
 * Runs on 1st of each month.
 */
async function processR1MonthlyUsage(): Promise<RetentionResult> {
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get paid users (active subscriptions) joined with user data
  const profiles = await query<{ id: string; email: string; name: string | null }>(
    `SELECT u.id, u.email, u.name
     FROM better_auth_user u
     INNER JOIN subscriptions s ON s.user_id = u.id
     WHERE s.status = 'active'
     LIMIT 200`
  )

  if (!profiles || profiles.length === 0) {
    console.error("[Retention R1] Failed to fetch subscriptions or no active users")
    return result
  }

  // Date range for last month
  const now = new Date()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  for (const profile of profiles) {
    result.processed++
    try {
      const allowed = await canSendEmail(profile.id, "retention_r1")
      if (!allowed) {
        result.skipped++
        continue
      }

      // Get monthly stats
      const [tradeRow, aiRow, creditRow, strategyRow] = await Promise.all([
        queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM trades
           WHERE user_id = $1 AND deleted_at IS NULL
             AND created_at >= $2 AND created_at <= $3`,
          [profile.id, lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
        ),
        queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM user_events
           WHERE user_id = $1 AND event_type = 'ai_agent_used'
             AND created_at >= $2 AND created_at <= $3`,
          [profile.id, lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
        ),
        queryOne<{ credits_used: number }>(
          `SELECT credits_used FROM ai_credits WHERE user_id = $1`,
          [profile.id]
        ),
        queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM strategies WHERE user_id = $1`,
          [profile.id]
        ),
      ])

      const stats = {
        tradesAnalyzed: parseInt(tradeRow?.count ?? "0", 10),
        aiInsights: parseInt(aiRow?.count ?? "0", 10),
        creditsUsed: creditRow?.credits_used ?? 0,
        strategiesActive: parseInt(strategyRow?.count ?? "0", 10),
        takerzScore: 0, // TakeZ Score calculated client-side, pass 0 for now
      }

      const sendResult = await sendRetentionR1Email({
        to: profile.email,
        userName: profile.name || undefined,
        userId: profile.id,
        stats,
      })

      if (sendResult.success) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Retention R1] Error for user ${profile.id}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * R2: Trade Milestones (100/500/1000/5000).
 * Check all users for newly crossed milestones.
 */
async function processR2TradeMilestones(): Promise<RetentionResult> {
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get users who signed up after feature launch
  const profiles = await query<{ id: string; email: string; name: string | null }>(
    `SELECT id, email, name FROM better_auth_user
     WHERE created_at >= $1
     LIMIT 200`,
    [FEATURE_LAUNCH_DATE]
  )

  if (!profiles || profiles.length === 0) {
    console.error("[Retention R2] Failed to fetch profiles")
    return result
  }

  for (const profile of profiles) {
    result.processed++
    try {
      // Count total trades
      const tradeRow = await queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM trades WHERE user_id = $1 AND deleted_at IS NULL`,
        [profile.id]
      )
      const total = parseInt(tradeRow?.count ?? "0", 10)

      // Check each milestone
      for (const milestone of TRADE_MILESTONES) {
        if (total >= milestone) {
          const dedupKey = `retention_r2_${milestone}`
          const allowed = await canSendEmail(profile.id, dedupKey)
          if (allowed) {
            const sendResult = await sendRetentionR2Email({
              to: profile.email,
              userName: profile.name || undefined,
              userId: profile.id,
              milestone,
            })
            if (sendResult.success) {
              result.sent++
              break // Send only highest new milestone
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Retention R2] Error for user ${profile.id}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * R3: Time Milestones (3/6/12 months).
 * Check profiles where created_at matches anniversary (+/- 1 day window).
 */
async function processR3TimeMilestones(): Promise<RetentionResult> {
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  const now = new Date()

  for (const months of TIME_MILESTONES) {
    const targetDate = new Date(now)
    targetDate.setMonth(targetDate.getMonth() - months)

    // +/- 1 day window
    const windowStart = new Date(targetDate)
    windowStart.setDate(windowStart.getDate() - 1)
    const windowEnd = new Date(targetDate)
    windowEnd.setDate(windowEnd.getDate() + 1)

    const profiles = await query<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM better_auth_user
       WHERE created_at >= $1 AND created_at <= $2
       LIMIT 100`,
      [windowStart.toISOString(), windowEnd.toISOString()]
    )

    if (!profiles || profiles.length === 0) continue

    for (const profile of profiles) {
      result.processed++
      try {
        const dedupKey = `retention_r3_${months}`
        const allowed = await canSendEmail(profile.id, dedupKey)
        if (!allowed) {
          result.skipped++
          continue
        }

        const sendResult = await sendRetentionR3Email({
          to: profile.email,
          userName: profile.name || undefined,
          userId: profile.id,
          months,
        })

        if (sendResult.success) result.sent++
        else result.skipped++
      } catch (err) {
        console.error(`[Retention R3] Error for user ${profile.id}:`, err)
        result.errors++
      }
    }
  }

  return result
}

/**
 * R5: Activity Declining.
 * Paid users with no login event in 7+ days who had previous activity.
 */
async function processR5ActivityDeclining(): Promise<RetentionResult> {
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get paid user IDs (active subscriptions)
  const subscriptions = await query<{ user_id: string }>(
    `SELECT user_id FROM subscriptions WHERE status = 'active' LIMIT 200`
  )

  if (!subscriptions || subscriptions.length === 0) {
    console.error("[Retention R5] Failed to fetch subscriptions or none found")
    return result
  }

  const userIds = subscriptions.map((s) => s.user_id)
  if (userIds.length === 0) return result

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  for (const userId of userIds) {
    result.processed++
    try {
      // Check last login event
      const lastLogin = await queryOne<{ created_at: string }>(
        `SELECT created_at FROM user_events
         WHERE user_id = $1 AND event_type = 'login'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      )

      // Skip if user logged in within 7 days
      if (lastLogin && new Date(lastLogin.created_at) > sevenDaysAgo) {
        result.skipped++
        continue
      }

      // Skip if user has no login events at all (brand new user, onboarding handles them)
      if (!lastLogin) {
        result.skipped++
        continue
      }

      const allowed = await canSendEmail(userId, "retention_r5")
      if (!allowed) {
        result.skipped++
        continue
      }

      // Get user profile for email
      const profile = await queryOne<{ email: string; name: string | null }>(
        `SELECT email, name FROM better_auth_user WHERE id = $1`,
        [userId]
      )

      if (!profile) {
        result.skipped++
        continue
      }

      const sendResult = await sendRetentionR5Email({
        to: profile.email,
        userName: profile.name || undefined,
        userId,
      })

      if (sendResult.success) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Retention R5] Error for user ${userId}:`, err)
      result.errors++
    }
  }

  return result
}
