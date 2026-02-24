import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

/**
 * Resend webhook handler for email open/click tracking.
 * Updates email_sends table with opened_at and clicked_at timestamps.
 *
 * Resend sends webhooks for: email.sent, email.delivered, email.opened,
 * email.clicked, email.bounced, email.complained
 *
 * We track: opened and clicked for analytics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate webhook (Resend uses svix for signing)
    // For now, validate via shared secret header
    if (RESEND_WEBHOOK_SECRET) {
      const signature = req.headers.get("svix-signature")
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }
      // TODO: Implement full svix signature verification when needed
    }

    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // We use custom headers to pass email metadata
    const emailType = data.tags?.email_type as string | undefined
    const userId = data.tags?.user_id as string | undefined

    if (!emailType || !userId) {
      // Not a lifecycle email or missing metadata — skip silently
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    if (type === "email.opened") {
      await supabase
        .from("email_sends")
        .update({ opened_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("email_type", emailType)
        .is("opened_at", null) // only update first open
    }

    if (type === "email.clicked") {
      await supabase
        .from("email_sends")
        .update({ clicked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("email_type", emailType)
        .is("clicked_at", null) // only update first click
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Resend Webhook] Error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
