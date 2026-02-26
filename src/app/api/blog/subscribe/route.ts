/**
 * POST /api/blog/subscribe
 * Subscribes an email to the blog newsletter.
 * No auth required — public endpoint.
 * Rate limit: 1 request per email per hour (in-memory).
 * Uses service_role for the insert (RLS bypass).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── In-memory rate limiter (single-server VPS) ───────────────────────────────
const rateLimitMap = new Map<string, number>()

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const lastRequest = rateLimitMap.get(email)

  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
    return false
  }

  rateLimitMap.set(email, now)
  return true
}

// Cleanup old entries every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key)
  }
}, 60 * 60 * 1000)

// ─── Email validation ─────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SubscribeBody {
  email: string
  locale?: string
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody
    const { email, locale } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const validLocale =
      typeof locale === "string" && ["en", "pt-BR"].includes(locale)
        ? locale
        : "en"

    const { error } = await supabase.from("blog_subscribers").upsert(
      {
        email: normalizedEmail,
        locale: validLocale,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: "email" }
    )

    if (error) {
      console.error("[blog/subscribe] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[blog/subscribe] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
