import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET
const TIMESTAMP_TOLERANCE_SECONDS = 300 // 5 minutes

/**
 * Verify Svix webhook signature (used by Resend).
 * Algorithm: HMAC-SHA256 over "{svix-id}.{svix-timestamp}.{body}" with base64-decoded secret.
 */
function verifySvixSignature(
  rawBody: string,
  headers: {
    svixId: string | null
    svixTimestamp: string | null
    svixSignature: string | null
  },
  secret: string
): boolean {
  const { svixId, svixTimestamp, svixSignature } = headers

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Check timestamp freshness
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SECONDS) return false

  // Decode secret (strip "whsec_" prefix if present)
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64"
  )

  // Create signed content
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64")

  // Svix signature header can contain multiple signatures: "v1,<sig1> v1,<sig2>"
  const signatures = svixSignature.split(" ")
  for (const sig of signatures) {
    const [version, value] = sig.split(",", 2)
    if (version !== "v1" || !value) continue
    try {
      const sigBuf = Buffer.from(value, "base64")
      const expectedBuf = Buffer.from(expectedSig, "base64")
      if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return true
      }
    } catch {
      continue
    }
  }

  return false
}

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
    const rawBody = await req.text()

    // Verify Svix signature if secret is configured
    if (RESEND_WEBHOOK_SECRET) {
      const isValid = verifySvixSignature(rawBody, {
        svixId: req.headers.get("svix-id"),
        svixTimestamp: req.headers.get("svix-timestamp"),
        svixSignature: req.headers.get("svix-signature"),
      }, RESEND_WEBHOOK_SECRET)

      if (!isValid) {
        console.warn("[Resend Webhook] Invalid signature — rejecting request")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)

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
