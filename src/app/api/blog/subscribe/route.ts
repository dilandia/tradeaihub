/**
 * POST /api/blog/subscribe
 * Subscribes an email to the blog newsletter.
 * No auth required — public endpoint.
 * Rate limit: 1 request per email per hour (in-memory).
 * Uses direct DB pool (bypasses RLS).
 */
import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"

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

    const pool = getPool()
    await pool.query(
      `INSERT INTO blog_subscribers (email, locale, subscribed_at, unsubscribed_at)
       VALUES ($1, $2, $3, NULL)
       ON CONFLICT (email) DO UPDATE SET
         locale = $2, subscribed_at = $3, unsubscribed_at = NULL`,
      [normalizedEmail, validLocale, new Date().toISOString()]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[blog/subscribe] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
