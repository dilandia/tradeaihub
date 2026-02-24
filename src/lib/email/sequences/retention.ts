"use server"

import { createClient } from "@supabase/supabase-js"
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get paid users (active subscriptions)
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("user_id, status")
    .eq("status", "active")
    .limit(200)

  if (error || !subscriptions) {
    console.error("[Retention R1] Failed to fetch subscriptions:", error?.message)
    return result
  }

  const userIds = subscriptions.map((s) => s.user_id)
  if (userIds.length === 0) return result

  // Get profiles for these users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  if (!profiles) return result

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
      const [tradeCount, aiCount, creditCount, strategyCount] = await Promise.all([
        supabase
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .is("deleted_at", null)
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("user_events")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("event_type", "ai_agent_used")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString()),
        supabase
          .from("ai_credits")
          .select("credits_used")
          .eq("user_id", profile.id)
          .single(),
        supabase
          .from("strategies")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
      ])

      const stats = {
        tradesAnalyzed: tradeCount.count ?? 0,
        aiInsights: aiCount.count ?? 0,
        creditsUsed: creditCount.data?.credits_used ?? 0,
        strategiesActive: strategyCount.count ?? 0,
        takerzScore: 0, // TakeZ Score calculated client-side, pass 0 for now
      }

      const sendResult = await sendRetentionR1Email({
        to: profile.email,
        userName: profile.full_name || undefined,
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get users who signed up after feature launch
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .gte("created_at", FEATURE_LAUNCH_DATE)
    .limit(200)

  if (error || !profiles) {
    console.error("[Retention R2] Failed to fetch profiles:", error?.message)
    return result
  }

  for (const profile of profiles) {
    result.processed++
    try {
      // Count total trades
      const { count: tradeCount } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .is("deleted_at", null)

      const total = tradeCount ?? 0

      // Check each milestone
      for (const milestone of TRADE_MILESTONES) {
        if (total >= milestone) {
          const dedupKey = `retention_r2_${milestone}`
          const allowed = await canSendEmail(profile.id, dedupKey)
          if (allowed) {
            const sendResult = await sendRetentionR2Email({
              to: profile.email,
              userName: profile.full_name || undefined,
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .gte("created_at", windowStart.toISOString())
      .lte("created_at", windowEnd.toISOString())
      .limit(100)

    if (error || !profiles) continue

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
          userName: profile.full_name || undefined,
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: RetentionResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  // Get paid users
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("status", "active")
    .limit(200)

  if (error || !subscriptions) {
    console.error("[Retention R5] Failed to fetch subscriptions:", error?.message)
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
      const { data: lastLogin } = await supabase
        .from("user_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_type", "login")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single()

      if (!profile) {
        result.skipped++
        continue
      }

      const sendResult = await sendRetentionR5Email({
        to: profile.email,
        userName: profile.full_name || undefined,
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
