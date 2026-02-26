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
  const affiliateCode = cookieStore.get("affiliate_ref")?.value

  if (!affiliateCode) return

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
      // Already attributed — just clear the cookie (set to expired)
      return
    }

    // Look up affiliate by code
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id, is_active, user_id")
      .eq("affiliate_code", affiliateCode)
      .eq("is_active", true)
      .maybeSingle()

    if (!affiliate) return

    // Prevent self-referral
    if (affiliate.user_id === userId) return

    // Create attribution row
    await admin.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      status: "registered",
    })

    // Increment total_referrals on the affiliate
    const { data: current } = await admin
      .from("affiliates")
      .select("total_referrals")
      .eq("id", affiliate.id)
      .single()

    if (current) {
      await admin
        .from("affiliates")
        .update({
          total_referrals: (current.total_referrals ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliate.id)
    }
  } catch (err) {
    // Non-blocking: log but don't surface the error
    console.error("[affiliate-processor] processAffiliateOnFirstLogin:", err)
  }
}
