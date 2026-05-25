"use server"

import { getPool } from "@/lib/db"

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
    const pool = getPool()
    await pool.query(
      `INSERT INTO user_events (user_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [userId, eventType, JSON.stringify(eventData || {})]
    )
  } catch (err) {
    console.error(`[Email Events] Failed to track ${eventType}:`, err)
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
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM user_events WHERE user_id = $1 AND event_type = $2`,
      [userId, eventType]
    )
    return parseInt(rows[0]?.cnt ?? "0", 10) > 0
  } catch {
    return false
  }
}
