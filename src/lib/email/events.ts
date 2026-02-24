"use server"

import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Supported event types for email lifecycle triggers.
 * Each event maps to specific email sequences.
 */
export type EmailEventType =
  | "import_completed"     // triggers: O2 skip, O3, T10
  | "ai_agent_used"        // triggers: O4 skip, C2
  | "feature_gate_hit"     // triggers: C1
  | "aha_moment"           // triggers: C4 (first AI insight)
  | "strategy_created"     // triggers: O5 skip
  | "credit_limit_80"      // triggers: C3
  | "credits_exhausted"    // triggers: T11
  | "milestone_trades"     // triggers: R2
  | "login"                // triggers: inactivity calc (W1, R5)
  | "dashboard_visited"    // triggers: O3 skip
  | "plan_upgraded"        // triggers: T8
  | "plan_cancelled"       // triggers: T9, R7
  | "cancellation_page_visited" // triggers: R6

/**
 * Track a user behavioral event for email lifecycle triggers.
 * Fire-and-forget — does NOT block the calling function.
 */
export async function trackEvent(
  userId: string,
  eventType: EmailEventType,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from("user_events")
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData || {},
      })

    if (error) {
      console.error(`[Email Events] Failed to track ${eventType}:`, error.message)
    }
  } catch (err) {
    console.error(`[Email Events] Exception tracking ${eventType}:`, err)
  }
}

/**
 * Check if a user has a specific event recorded.
 */
export async function hasEvent(
  userId: string,
  eventType: EmailEventType
): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType)

    if (error) {
      console.error(`[Email Events] Failed to check ${eventType}:`, error.message)
      return false
    }

    return (count ?? 0) > 0
  } catch {
    return false
  }
}
