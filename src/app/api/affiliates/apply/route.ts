/**
 * POST /api/affiliates/apply
 * Receives affiliate program applications.
 * No auth required — applicants may not have an account.
 * Rate limit: 3 requests per IP per hour.
 * Uses service_role for the insert (RLS bypass).
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { sendAffiliateApplicationReceivedEmail } from "@/lib/email/send"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── In-memory rate limiter (single-server VPS) ───────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Cleanup old entries every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 60 * 60 * 1000)

// ─── Validation schema ────────────────────────────────────────────────────────
const applySchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  whatsapp: z.string().min(5, "WhatsApp must be at least 5 characters").max(30).trim(),
  primarySocial: z.string().min(1).max(50),
  socialUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  audienceSize: z.string().max(20).optional().nullable(),
  pitch: z.string().min(50).max(1000).trim(),
  tradingExperience: z.string().max(30).optional().nullable(),
})

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  const allowed = checkRateLimit(`affiliate_apply:${ip}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many applications from this IP. Please try again later." },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Validate
  const parsed = applySchema.safeParse(body)
  if (!parsed.success) {
    const firstError = (parsed.error as any).errors?.[0]
    return NextResponse.json(
      { error: firstError?.message ?? "Invalid input" },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Check for duplicate email (pending or approved)
  const { data: existing } = await supabase
    .from("affiliate_applications")
    .select("id, status")
    .eq("email", data.email)
    .in("status", ["pending", "approved"])
    .maybeSingle()

  if (existing) {
    if (existing.status === "approved") {
      return NextResponse.json(
        { error: "This email is already registered as an affiliate." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "An application with this email is already pending review." },
      { status: 409 }
    )
  }

  // Capture locale from Accept-Language header
  const acceptLang = req.headers.get("accept-language") || ""
  const preferredLocale = acceptLang.startsWith("pt") ? "pt-BR" : acceptLang.split(",")[0]?.split(";")[0]?.trim() || "en"

  // Insert application
  const { error: insertError } = await supabase.from("affiliate_applications").insert({
    full_name: data.fullName,
    email: data.email,
    whatsapp: data.whatsapp || null,
    primary_social: data.primarySocial,
    social_url: data.socialUrl || null,
    audience_size: data.audienceSize || null,
    pitch: data.pitch,
    trading_experience: data.tradingExperience || null,
    preferred_locale: preferredLocale,
  })

  if (insertError) {
    // Handle unique constraint violation (race condition on duplicate email)
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "An application with this email already exists." },
        { status: 409 }
      )
    }
    console.error("[affiliates/apply] Insert error:", { code: insertError.code, message: insertError.message })
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 })
  }

  // Send confirmation email (non-blocking)
  sendAffiliateApplicationReceivedEmail({
    to: data.email,
    applicantName: data.fullName,
    locale: preferredLocale,
  }).catch((e) => console.error("[affiliates/apply] confirmation email error:", e))

  return NextResponse.json({ success: true })
}
