import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { tradingReportEmailHtml } from "@/lib/email/templates/trading-report"

const CRON_SECRET = process.env.CRON_SECRET
const FROM =
  process.env.RESEND_FROM_EMAIL || "Trade AI Hub <onboarding@resend.dev>"

export async function GET(req: NextRequest) {
  // Validate cron secret
  const secret = req.headers.get("x-cron-secret")
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    )
  }
  const resend = new Resend(resendKey)

  const frequency = req.nextUrl.searchParams.get("frequency") || "weekly"

  // Use service role client for admin queries (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find users who opted in
  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, email_reports_last_sent"
    )
    .eq("email_reports_enabled", true)
    .eq("email_report_frequency", frequency)

  if (usersError || !users) {
    return NextResponse.json(
      { error: usersError?.message || "No users" },
      { status: 500 }
    )
  }

  // Filter users who haven't received a report recently
  const now = new Date()
  const intervalMs =
    frequency === "monthly"
      ? 28 * 24 * 60 * 60 * 1000
      : 6 * 24 * 60 * 60 * 1000

  const eligibleUsers = users.filter((u) => {
    if (!u.email_reports_last_sent) return true
    const lastSent = new Date(u.email_reports_last_sent)
    return now.getTime() - lastSent.getTime() > intervalMs
  })

  // Calculate date range
  const endDate = now.toISOString().slice(0, 10)
  const startMs =
    frequency === "monthly"
      ? now.getTime() - 30 * 24 * 60 * 60 * 1000
      : now.getTime() - 7 * 24 * 60 * 60 * 1000
  const startDate = new Date(startMs).toISOString().slice(0, 10)

  let sent = 0
  let failed = 0

  for (const user of eligibleUsers) {
    try {
      // Fetch metrics using the RPC (5-param version)
      const { data: metricsData } = await supabase.rpc("get_trade_metrics", {
        p_user_id: user.id,
        p_import_id: null,
        p_account_id: null,
        p_start_date: startDate,
        p_end_date: endDate,
      })

      const m = metricsData?.[0]
      if (!m || m.total_trades === 0) continue // Skip users with no trades

      // Compute derived metrics from RPC raw data
      const totalTrades = m.total_trades || 0
      const wins = m.winning_trades || 0
      const losses = m.losing_trades || 0
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
      const grossProfitDollar = Number(m.gross_profit_dollar) || 0
      const grossLossDollar = Number(m.gross_loss_dollar) || 0
      const profitFactor =
        grossLossDollar > 0 ? grossProfitDollar / grossLossDollar : 0
      const netDollar = Number(m.net_dollar) || 0
      const bestTradePnl = Number(m.best_trade_pnl) || 0
      const worstTradePnl = Number(m.worst_trade_pnl) || 0

      // Simple TakeZ Score approximation: weighted blend of win rate and profit factor
      const zellaScore = Math.min(
        100,
        Math.max(0, winRate * 0.6 + Math.min(profitFactor, 3) * 13.33)
      )

      const html = tradingReportEmailHtml({
        userName: user.full_name || undefined,
        locale: "en", // profiles table has no language column; default to English
        period: frequency as "weekly" | "monthly",
        startDate,
        endDate,
        metrics: {
          totalTrades,
          wins,
          losses,
          winRate,
          netDollar,
          profitFactor,
          bestTradePnl,
          worstTradePnl,
          zellaScore,
        },
      })

      const isPt = false // No language column available
      const periodLabel = frequency === "weekly" ? "Weekly" : "Monthly"
      const subject = isPt
        ? `Seu Relatorio ${periodLabel} de Trading — Trade AI Hub`
        : `Your ${periodLabel} Trading Report — Trade AI Hub`

      const { error: sendError } = await resend.emails.send({
        from: FROM,
        to: user.email,
        subject,
        html,
      })

      if (!sendError) {
        // Update last sent timestamp
        await supabase
          .from("profiles")
          .update({ email_reports_last_sent: now.toISOString() })
          .eq("id", user.id)
        sent++
      } else {
        console.error(
          `[cron/email-reports] Send failed for user ${user.id}:`,
          sendError
        )
        failed++
      }
    } catch (err) {
      console.error(
        `[cron/email-reports] Failed for user ${user.id}:`,
        err
      )
      failed++
    }
  }

  return NextResponse.json({
    frequency,
    eligible: eligibleUsers.length,
    sent,
    failed,
    startDate,
    endDate,
  })
}
