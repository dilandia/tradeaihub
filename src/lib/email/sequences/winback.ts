"use server"

import { createClient } from "@supabase/supabase-js"
import { canSendEmail } from "@/lib/email/scheduler"
import {
  sendWinbackW1Email,
  sendWinbackW2Email,
  sendWinbackW3Email,
  sendWinbackW4Email,
} from "@/lib/email/send"

interface WinbackResult {
  processed: number
  sent: number
  skipped: number
  errors: number
}

/**
 * Process win-back / re-engagement emails for inactive users.
 * W1: 14 days inactive — friendly check-in (all users)
 * W2: 21 days inactive — value/news update (all users)
 * W3: 30 days inactive — last attempt (paid users only)
 * W4: 30 days inactive — free reactivation (free users only)
 * W5/W6 are deferred (require Stripe coupon integration).
 *
 * Uses canSendEmail for dedup — each winback type sent only once per user.
 */
export async function processWinbackEmails(): Promise<WinbackResult> {
  const result: WinbackResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    const w1 = await processWinbackTier("winback_w1", 14, sendWinbackW1Email)
    result.processed += w1.processed
    result.sent += w1.sent
    result.skipped += w1.skipped
    result.errors += w1.errors
  } catch (err) {
    console.error("[Winback] W1 processing error:", err)
    result.errors++
  }

  try {
    const w2 = await processWinbackTier("winback_w2", 21, sendWinbackW2Email)
    result.processed += w2.processed
    result.sent += w2.sent
    result.skipped += w2.skipped
    result.errors += w2.errors
  } catch (err) {
    console.error("[Winback] W2 processing error:", err)
    result.errors++
  }

  try {
    const w3 = await processW3PaidUsers()
    result.processed += w3.processed
    result.sent += w3.sent
    result.skipped += w3.skipped
    result.errors += w3.errors
  } catch (err) {
    console.error("[Winback] W3 processing error:", err)
    result.errors++
  }

  try {
    const w4 = await processW4FreeUsers()
    result.processed += w4.processed
    result.sent += w4.sent
    result.skipped += w4.skipped
    result.errors += w4.errors
  } catch (err) {
    console.error("[Winback] W4 processing error:", err)
    result.errors++
  }

  return result
}

/**
 * Generic winback tier processor for W1 and W2.
 * Finds users inactive for `daysInactive` days and sends the email.
 */
async function processWinbackTier(
  emailType: string,
  daysInactive: number,
  sendFn: (params: {
    to: string
    userName?: string
    locale?: string
    userId?: string
  }) => Promise<{ success: boolean; error?: string }>
): Promise<WinbackResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: WinbackResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

  // Get all profiles, then filter by last login
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .lte("updated_at", cutoffDate.toISOString())
    .limit(200)

  if (error || !profiles) {
    console.error(`[Winback ${emailType}] Failed to fetch profiles:`, error?.message)
    return result
  }

  for (const profile of profiles) {
    result.processed++
    try {
      // Verify last login is truly older than cutoff
      const { data: lastLogin } = await supabase
        .from("user_events")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("event_type", "login")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // If user has recent login events, skip
      if (lastLogin && new Date(lastLogin.created_at) > cutoffDate) {
        result.skipped++
        continue
      }

      // If user never logged in (no events at all), skip — onboarding handles them
      if (!lastLogin) {
        result.skipped++
        continue
      }

      const allowed = await canSendEmail(profile.id, emailType)
      if (!allowed) {
        result.skipped++
        continue
      }

      const sendResult = await sendFn({
        to: profile.email,
        userName: profile.full_name || undefined,
        userId: profile.id,
      })

      if (sendResult.success) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Winback ${emailType}] Error for user ${profile.id}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * W3: Last attempt for PAID users who have been inactive 30+ days.
 */
async function processW3PaidUsers(): Promise<WinbackResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: WinbackResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get paid users (active or past_due subscriptions)
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "past_due"])
    .limit(200)

  if (error || !subscriptions) {
    console.error("[Winback W3] Failed to fetch subscriptions:", error?.message)
    return result
  }

  const userIds = subscriptions.map((s) => s.user_id)
  if (userIds.length === 0) return result

  for (const userId of userIds) {
    result.processed++
    try {
      // Check last login
      const { data: lastLogin } = await supabase
        .from("user_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_type", "login")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!lastLogin || new Date(lastLogin.created_at) > thirtyDaysAgo) {
        result.skipped++
        continue
      }

      const allowed = await canSendEmail(userId, "winback_w3")
      if (!allowed) {
        result.skipped++
        continue
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single()

      if (!profile) {
        result.skipped++
        continue
      }

      const sendResult = await sendWinbackW3Email({
        to: profile.email,
        userName: profile.full_name || undefined,
        userId,
      })

      if (sendResult.success) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Winback W3] Error for user ${userId}:`, err)
      result.errors++
    }
  }

  return result
}

/**
 * W4: Free reactivation for FREE users inactive 30+ days.
 */
async function processW4FreeUsers(): Promise<WinbackResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const result: WinbackResult = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get all profiles updated more than 30 days ago
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .lte("updated_at", thirtyDaysAgo.toISOString())
    .limit(200)

  if (error || !profiles) {
    console.error("[Winback W4] Failed to fetch profiles:", error?.message)
    return result
  }

  // Get paid user IDs to exclude them
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id")
    .in("status", ["active", "past_due", "trialing"])

  const paidUserIds = new Set((subscriptions || []).map((s) => s.user_id))

  for (const profile of profiles) {
    // Skip paid users — they get W3 instead
    if (paidUserIds.has(profile.id)) continue

    result.processed++
    try {
      // Verify last login is truly older than 30 days
      const { data: lastLogin } = await supabase
        .from("user_events")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("event_type", "login")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!lastLogin || new Date(lastLogin.created_at) > thirtyDaysAgo) {
        result.skipped++
        continue
      }

      const allowed = await canSendEmail(profile.id, "winback_w4")
      if (!allowed) {
        result.skipped++
        continue
      }

      const sendResult = await sendWinbackW4Email({
        to: profile.email,
        userName: profile.full_name || undefined,
        userId: profile.id,
      })

      if (sendResult.success) result.sent++
      else result.skipped++
    } catch (err) {
      console.error(`[Winback W4] Error for user ${profile.id}:`, err)
      result.errors++
    }
  }

  return result
}
