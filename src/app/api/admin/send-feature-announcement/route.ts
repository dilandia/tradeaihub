import { NextRequest, NextResponse } from "next/server"
import { getPool } from "@/lib/db"
import { sendRetentionR8Email } from "@/lib/email/send"

const MAX_BATCH_SIZE = 200

export async function POST(req: NextRequest) {
  // Auth: require CRON_SECRET as admin header
  const secret = req.headers.get("x-admin-secret")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      featureTitle,
      featureDescription,
      ctaUrl,
      ctaText,
      segment = "all",
    } = body as {
      featureTitle: string
      featureDescription: string
      ctaUrl: string
      ctaText?: string
      segment?: "all" | "free" | "paid"
    }

    if (!featureTitle || !featureDescription || !ctaUrl) {
      return NextResponse.json(
        { error: "Missing required fields: featureTitle, featureDescription, ctaUrl" },
        { status: 400 }
      )
    }

    const pool = getPool()

    // Get all profiles
    const profilesRes = await pool.query(
      `SELECT id, email, full_name FROM profiles LIMIT $1`,
      [MAX_BATCH_SIZE]
    )
    const profiles = profilesRes.rows as { id: string; email: string; full_name: string | null }[]

    if (!profiles.length) {
      return NextResponse.json(
        { error: "Failed to fetch profiles or no profiles found" },
        { status: 500 }
      )
    }

    // Filter by segment if needed
    let targetUsers = profiles

    if (segment === "free" || segment === "paid") {
      // Get users with active subscriptions
      const subsRes = await pool.query(
        `SELECT user_id FROM subscriptions WHERE status IN ('active', 'trialing')`
      )
      const paidUserIds = new Set((subsRes.rows as { user_id: string }[]).map((s) => s.user_id))

      if (segment === "free") {
        targetUsers = profiles.filter((p) => !paidUserIds.has(p.id))
      } else {
        targetUsers = profiles.filter((p) => paidUserIds.has(p.id))
      }
    }

    let sent = 0
    let failed = 0

    for (const user of targetUsers) {
      try {
        const result = await sendRetentionR8Email({
          to: user.email,
          userName: user.full_name || undefined,
          featureTitle,
          featureDescription,
          ctaUrl,
          ctaText,
          userId: user.id,
        })

        if (result.success) {
          sent++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      segment,
      totalTargeted: targetUsers.length,
    })
  } catch (error) {
    console.error("[Admin] Feature announcement error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
