/**
 * affiliate-processor.ts
 *
 * Reads the affiliate_ref cookie on first dashboard load and creates the
 * attribution row in affiliate_referrals. Fire-and-forget pattern,
 * identical to the referral processor. Must run server-side.
 */
import { cookies } from "next/headers"
import { getPool, queryOne } from "@/lib/db"

export async function processAffiliateOnFirstLogin(userId: string): Promise<void> {
  const cookieStore = await cookies()
  const rawCode = cookieStore.get("affiliate_ref")?.value

  if (!rawCode) return

  // Normalize to uppercase (middleware regex only matches uppercase, but be safe)
  const affiliateCode = rawCode.toUpperCase()

  // Validate format
  if (!/^[A-Z0-9-]{6,30}$/.test(affiliateCode)) {
    // Invalid code — clear cookie and bail
    cookieStore.delete("affiliate_ref")
    return
  }

  const pool = getPool()

  try {
    // Check if this user already has an affiliate attribution
    const existingRef = await queryOne<{ id: string }>(
      `SELECT id FROM affiliate_referrals WHERE referred_user_id = $1`,
      [userId]
    )

    if (existingRef) {
      // Already attributed — clear the cookie
      cookieStore.delete("affiliate_ref")
      return
    }

    // Look up affiliate by code (case-insensitive via uppercase normalization)
    const affiliate = await queryOne<{ id: string; is_active: boolean; user_id: string }>(
      `SELECT id, is_active, user_id FROM affiliates WHERE affiliate_code = $1 AND is_active = true`,
      [affiliateCode]
    )

    if (!affiliate) {
      cookieStore.delete("affiliate_ref")
      return
    }

    // Prevent self-referral
    if (affiliate.user_id === userId) {
      cookieStore.delete("affiliate_ref")
      return
    }

    // Create attribution row
    try {
      await pool.query(
        `INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, status) VALUES ($1, $2, 'registered')`,
        [affiliate.id, userId]
      )
    } catch (insertErr: unknown) {
      // Likely unique constraint violation — user already referred
      const msg = insertErr instanceof Error ? insertErr.message : String(insertErr)
      console.error("[affiliate-processor] insert referral:", msg)
      cookieStore.delete("affiliate_ref")
      return
    }

    // Atomically increment total_referrals using optimistic locking
    for (let retry = 0; retry < 3; retry++) {
      const current = await queryOne<{ total_referrals: number }>(
        `SELECT total_referrals FROM affiliates WHERE id = $1`,
        [affiliate.id]
      )

      if (!current) break

      const currentCount = current.total_referrals ?? 0
      const result = await pool.query(
        `UPDATE affiliates SET total_referrals = $1, updated_at = $2 WHERE id = $3 AND total_referrals = $4`,
        [currentCount + 1, new Date().toISOString(), affiliate.id, currentCount]
      )

      if (result.rowCount && result.rowCount > 0) break
    }

    // Clear cookie after successful processing
    cookieStore.delete("affiliate_ref")
  } catch (err) {
    // Non-blocking: log but don't surface the error
    console.error("[affiliate-processor] processAffiliateOnFirstLogin:", err)
  }
}
