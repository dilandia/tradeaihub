/**
 * C4: Aha Moment email trigger.
 * Sends a conversion email when a Free user gets their first AI insight.
 * Fire-and-forget — never blocks the AI response.
 */

import { hasEvent, trackEvent } from "@/lib/email/events"
import { sendConversionC4Email } from "@/lib/email/send"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Check if this is the user's first AI insight and send C4 email if so.
 * Only targets Free plan users who haven't received this email before.
 */
export async function fireAhaMomentEmail(
  userId: string,
  insightType: string
): Promise<void> {
  try {
    // Skip if user already had an aha moment
    const hadBefore = await hasEvent(userId, "aha_moment")
    if (hadBefore) return

    // Track the aha moment event
    trackEvent(userId, "aha_moment", { insight_type: insightType }).catch(() => {})

    // Check if user is on Free plan (only target Free users for conversion)
    const supabase = createAdminClient()
    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("email, full_name, locale").eq("id", userId).single(),
      supabase.from("subscriptions").select("plan, status").eq("user_id", userId).single(),
    ])

    const isFreePlan = !sub || sub.plan === "free" || (sub.status !== "active" && sub.status !== "trialing")
    if (!isFreePlan) return

    if (profile?.email) {
      sendConversionC4Email({
        to: profile.email,
        userName: profile.full_name || undefined,
        locale: profile.locale || undefined,
        insightType,
        userId,
      }).catch(() => {})
    }
  } catch {
    // Non-blocking — silently ignore aha moment email failures
  }
}
