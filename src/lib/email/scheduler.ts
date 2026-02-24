"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Email category mapping for preference checks.
 * Transactional emails are ALWAYS sent (not subject to preferences).
 */
const EMAIL_CATEGORY_MAP: Record<string, "transactional" | "onboarding" | "marketing" | "product_updates"> = {
  // Transactional — always sent
  payment_confirmation: "transactional",
  payment_failed: "transactional",
  upgrade_confirmed: "transactional",
  cancellation: "transactional",
  import_completed: "transactional",
  credits_exhausted: "transactional",
  password_reset: "transactional",
  welcome: "transactional",
  referral_reward: "transactional",
  // Onboarding sequence
  onboarding_o2: "onboarding",
  onboarding_o3: "onboarding",
  onboarding_o4: "onboarding",
  onboarding_o5: "onboarding",
  onboarding_o6: "onboarding",
  // Conversion / marketing
  conversion_c1: "marketing",
  conversion_c2: "marketing",
  conversion_c3: "marketing",
  conversion_c4: "marketing",
  conversion_c5: "marketing",
  conversion_c6: "marketing",
  conversion_c7: "marketing",
  conversion_c8: "marketing",
  // Product updates / retention
  retention_r1: "product_updates",
  retention_r2: "product_updates",
  retention_r3: "product_updates",
  retention_r4: "product_updates",
  retention_r5: "product_updates",
  retention_r6: "product_updates",
  retention_r7: "product_updates",
  retention_r8: "product_updates",
  // Re-engagement
  winback_w1: "marketing",
  winback_w2: "marketing",
  winback_w3: "marketing",
  winback_w4: "marketing",
  winback_w5: "marketing",
  winback_w6: "marketing",
}

/** Max non-transactional emails per user per week */
const MAX_NON_TRANSACTIONAL_PER_WEEK = 3

/**
 * Check if an email can be sent to a user.
 * Returns true if: (a) not already sent (dedup), (b) preferences allow it, (c) frequency cap not exceeded.
 */
export async function canSendEmail(
  userId: string,
  emailType: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const category = EMAIL_CATEGORY_MAP[emailType] || "marketing"

    // Transactional emails always pass
    if (category === "transactional") {
      // Still check dedup for transactional
      const { count: existing } = await supabase
        .from("email_sends")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("email_type", emailType)

      return (existing ?? 0) === 0
    }

    // 1. Check dedup — has this email already been sent?
    const { count: existing } = await supabase
      .from("email_sends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("email_type", emailType)

    if ((existing ?? 0) > 0) return false

    // 2. Check user preferences
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("onboarding, marketing, product_updates")
      .eq("user_id", userId)
      .single()

    if (prefs) {
      if (category === "onboarding" && !prefs.onboarding) return false
      if (category === "marketing" && !prefs.marketing) return false
      if (category === "product_updates" && !prefs.product_updates) return false
    }

    // 3. Check weekly frequency cap (non-transactional)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: recentCount } = await supabase
      .from("email_sends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("sent_at", weekAgo.toISOString())

    if ((recentCount ?? 0) >= MAX_NON_TRANSACTIONAL_PER_WEEK) return false

    return true
  } catch (err) {
    console.error(`[Email Scheduler] canSendEmail error for ${emailType}:`, err)
    return false
  }
}

/**
 * Record that an email was sent. Uses upsert to handle dedup gracefully.
 */
export async function recordSend(
  userId: string,
  emailType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("email_sends")
      .upsert(
        {
          user_id: userId,
          email_type: emailType,
          sent_at: new Date().toISOString(),
          metadata: metadata || {},
        },
        { onConflict: "user_id,email_type" }
      )

    if (error) {
      console.error(`[Email Scheduler] recordSend error for ${emailType}:`, error.message)
    }
  } catch (err) {
    console.error(`[Email Scheduler] recordSend exception:`, err)
  }
}

/**
 * Get the email category for a given email type.
 */
export async function getEmailCategory(emailType: string): Promise<string> {
  return EMAIL_CATEGORY_MAP[emailType] || "marketing"
}
