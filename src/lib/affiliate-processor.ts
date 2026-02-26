/**
 * affiliate-processor.ts
 *
 * Reads the affiliate_ref cookie on first dashboard load and creates the
 * attribution row in affiliate_referrals. Fire-and-forget pattern,
 * identical to the referral processor. Must run server-side.
 */
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Check if this user already has an affiliate attribution
    const { data: existingRef } = await admin
      .from("affiliate_referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .maybeSingle()

    if (existingRef) {
      // Already attributed — clear the cookie
      cookieStore.delete("affiliate_ref")
      return
    }

    // Look up affiliate by code (case-insensitive via uppercase normalization)
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id, is_active, user_id")
      .eq("affiliate_code", affiliateCode)
      .eq("is_active", true)
      .maybeSingle()

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
    const { error: insertErr } = await admin.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      status: "registered",
    })

    if (insertErr) {
      // Likely unique constraint violation — user already referred
      console.error("[affiliate-processor] insert referral:", insertErr.message)
      cookieStore.delete("affiliate_ref")
      return
    }

    // Atomically increment total_referrals using optimistic locking
    for (let retry = 0; retry < 3; retry++) {
      const { data: current } = await admin
        .from("affiliates")
        .select("total_referrals")
        .eq("id", affiliate.id)
        .single()

      if (!current) break

      const currentCount = current.total_referrals ?? 0
      const { error: updateErr, count } = await admin
        .from("affiliates")
        .update({
          total_referrals: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliate.id)
        .eq("total_referrals", currentCount)

      if (!updateErr && count && count > 0) break
    }

    // Clear cookie after successful processing
    cookieStore.delete("affiliate_ref")
  } catch (err) {
    // Non-blocking: log but don't surface the error
    console.error("[affiliate-processor] processAffiliateOnFirstLogin:", err)
  }
}
