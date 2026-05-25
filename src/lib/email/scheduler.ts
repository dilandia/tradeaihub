"use server"

import { getPool } from "@/lib/db"

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
    const pool = getPool()
    const category = EMAIL_CATEGORY_MAP[emailType] || "marketing"

    // Check dedup — has this email already been sent?
    const { rows: existingRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM email_sends WHERE user_id = $1 AND email_type = $2`,
      [userId, emailType]
    )
    const existing = parseInt(existingRows[0]?.cnt ?? "0", 10)

    // Transactional: only dedup check
    if (category === "transactional") {
      return existing === 0
    }

    if (existing > 0) return false

    // Check user preferences
    const { rows: prefRows } = await pool.query(
      `SELECT onboarding, marketing, product_updates FROM email_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    )
    const prefs = prefRows[0]
    if (prefs) {
      if (category === "onboarding" && !prefs.onboarding) return false
      if (category === "marketing" && !prefs.marketing) return false
      if (category === "product_updates" && !prefs.product_updates) return false
    }

    // Check weekly frequency cap
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { rows: recentRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM email_sends WHERE user_id = $1 AND sent_at >= $2`,
      [userId, weekAgo.toISOString()]
    )
    const recentCount = parseInt(recentRows[0]?.cnt ?? "0", 10)

    return recentCount < MAX_NON_TRANSACTIONAL_PER_WEEK
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
    const pool = getPool()
    await pool.query(
      `INSERT INTO email_sends (user_id, email_type, sent_at, metadata)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (user_id, email_type) DO UPDATE SET
         sent_at = EXCLUDED.sent_at,
         metadata = EXCLUDED.metadata`,
      [userId, emailType, JSON.stringify(metadata || {})]
    )
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
