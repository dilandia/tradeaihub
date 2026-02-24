import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .limit(MAX_BATCH_SIZE)

    if (profilesError || !profiles) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profilesError?.message}` },
        { status: 500 }
      )
    }

    // Filter by segment if needed
    let targetUsers = profiles

    if (segment === "free" || segment === "paid") {
      // Get users with active subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id")
        .in("status", ["active", "trialing"])

      const paidUserIds = new Set((subs || []).map((s) => s.user_id))

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
