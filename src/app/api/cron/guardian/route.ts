import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { sendGuardianAlertEmail } from "@/lib/email/send"

const CRON_SECRET = process.env.CRON_SECRET

function isValidCronSecret(provided: string | null): boolean {
  if (!CRON_SECRET || !provided) return false
  const a = Buffer.from(CRON_SECRET)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function getServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ScanEvent {
  severity: string
  module: string
  check_name: string
  description: string
  details: Record<string, unknown>
  auto_action_taken?: string
}

interface ScanModuleResult {
  events: ScanEvent[]
  checks: number
  issues: number
}

/**
 * Guardian Security Scan — runs every 3 hours via cron.
 * Executes all security scan modules and stores results.
 *
 * Cron schedule: every 3 hours
 * Header: x-cron-secret: <CRON_SECRET>
 *
 * Scan type can be specified via ?type=full|quick
 * - full: all 8 modules (default)
 * - quick: only CRITICAL modules (credit_anomaly, rpc_permissions)
 */
export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const scanType = req.nextUrl.searchParams.get("type") || "full"
  const supabase = getServiceClient()
  const startedAt = new Date()

  // Create scan record
  const { data: scanRecord, error: scanError } = await supabase
    .from("guardian_scan_results")
    .insert({
      scan_type: scanType,
      started_at: startedAt.toISOString(),
      status: "running",
    })
    .select("id")
    .single()

  if (scanError || !scanRecord) {
    console.error("[Guardian] Failed to create scan record:", scanError)
    return NextResponse.json(
      { error: "Failed to initialize scan" },
      { status: 500 }
    )
  }

  const scanId = scanRecord.id
  let totalChecks = 0
  let totalEvents = 0
  let criticalCount = 0
  let highCount = 0
  let mediumCount = 0
  let lowCount = 0
  let autoFixesApplied = 0
  const modulesRun: string[] = []
  const allEvents: ScanEvent[] = []

  try {
    // ============================================================
    // MODULE 1: Credit Anomaly Detection [CRITICAL]
    // ============================================================
    const creditResult = await runModule(supabase, "guardian_run_credit_anomaly_check")
    if (creditResult) {
      modulesRun.push("credit_anomaly")
      totalChecks += creditResult.checks
      const counts = countBySeverity(creditResult.events)
      criticalCount += counts.CRITICAL
      highCount += counts.HIGH
      totalEvents += creditResult.issues
      allEvents.push(...creditResult.events)

      // AUTO-FIX: Reset credits for free users
      for (const evt of creditResult.events) {
        if (evt.check_name === "free_users_with_credits" && evt.details) {
          const details = evt.details as { user_id?: string }
          if (details.user_id) {
            const { error: resetErr } = await supabase
              .from("ai_credits")
              .update({ credits_remaining: 0 })
              .eq("user_id", details.user_id)

            if (!resetErr) {
              autoFixesApplied++
              evt.auto_action_taken = `Credits reset to 0 for user ${(details.user_id as string).slice(0, 8)}...`
            }
          }
        }
      }
    }

    // ============================================================
    // MODULE 2: RPC Permission Audit [CRITICAL]
    // ============================================================
    const rpcResult = await runModule(supabase, "guardian_run_rpc_permission_audit")
    if (rpcResult) {
      modulesRun.push("rpc_permissions")
      totalChecks += rpcResult.checks
      const counts = countBySeverity(rpcResult.events)
      criticalCount += counts.CRITICAL
      highCount += counts.HIGH
      totalEvents += rpcResult.issues
      allEvents.push(...rpcResult.events)

      // AUTO-FIX: Revoke exposed admin RPCs
      for (const evt of rpcResult.events) {
        if (evt.check_name === "admin_rpcs_exposed" && evt.details) {
          const details = evt.details as { function?: string; args?: string }
          if (details.function) {
            try {
              const sig = details.args
                ? `${details.function}(${details.args})`
                : details.function
              await supabase.rpc("exec_sql_admin", {
                query: `REVOKE EXECUTE ON FUNCTION public.${sig} FROM anon, authenticated`,
              })
              autoFixesApplied++
              evt.auto_action_taken = `REVOKE EXECUTE from anon/authenticated on ${details.function}`
            } catch {
              // exec_sql_admin may not exist, log and continue
            }
          }
        }
      }
    }

    // Skip remaining modules for quick scan
    if (scanType === "full") {
      // ============================================================
      // MODULE 3: RLS Policy Audit [HIGH]
      // ============================================================
      const rlsResult = await runModule(supabase, "guardian_run_rls_audit")
      if (rlsResult) {
        modulesRun.push("rls_audit")
        totalChecks += rlsResult.checks
        const counts = countBySeverity(rlsResult.events)
        highCount += counts.HIGH
        mediumCount += counts.MEDIUM
        totalEvents += rlsResult.issues
        allEvents.push(...rlsResult.events)
      }

      // ============================================================
      // MODULE 4: Table Grant Audit [HIGH]
      // ============================================================
      const grantResult = await runModule(supabase, "guardian_run_grant_audit")
      if (grantResult) {
        modulesRun.push("grant_audit")
        totalChecks += grantResult.checks
        const counts = countBySeverity(grantResult.events)
        highCount += counts.HIGH
        totalEvents += grantResult.issues
        allEvents.push(...grantResult.events)
      }

      // ============================================================
      // MODULE 7: Function Security Audit [MEDIUM]
      // ============================================================
      const funcResult = await runModule(supabase, "guardian_run_function_security_audit")
      if (funcResult) {
        modulesRun.push("function_security")
        totalChecks += funcResult.checks
        const counts = countBySeverity(funcResult.events)
        mediumCount += counts.MEDIUM
        totalEvents += funcResult.issues
        allEvents.push(...funcResult.events)
      }
    }

    // ============================================================
    // Store all events
    // ============================================================
    if (allEvents.length > 0) {
      const eventRows = allEvents.map((evt) => ({
        scan_id: scanId,
        severity: evt.severity,
        module: evt.module,
        check_name: evt.check_name,
        description: evt.description,
        details: evt.details || {},
        auto_action_taken: evt.auto_action_taken || null,
      }))

      const { error: insertErr } = await supabase
        .from("security_events")
        .insert(eventRows)

      if (insertErr) {
        console.error("[Guardian] Failed to store events:", insertErr)
      }
    }

    // ============================================================
    // Update scan record with results
    // ============================================================
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()

    await supabase
      .from("guardian_scan_results")
      .update({
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        modules_run: modulesRun,
        total_checks: totalChecks,
        events_found: totalEvents,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        auto_fixes_applied: autoFixesApplied,
        status: "completed",
        summary: {
          scan_type: scanType,
          modules: modulesRun.length,
          verdict:
            criticalCount > 0
              ? "THREATS_DETECTED"
              : highCount > 0
                ? "WARNINGS"
                : "ALL_CLEAR",
        },
      })
      .eq("id", scanId)

    // Log summary
    const verdict =
      criticalCount > 0
        ? "THREATS DETECTED"
        : highCount > 0
          ? "WARNINGS"
          : "ALL CLEAR"

    console.log(
      `[Guardian] Scan ${scanType} completed in ${durationMs}ms | ` +
        `${totalChecks} checks | ${totalEvents} events | ` +
        `CRITICAL:${criticalCount} HIGH:${highCount} MEDIUM:${mediumCount} | ` +
        `Auto-fixes:${autoFixesApplied} | Verdict: ${verdict}`
    )

    // ============================================================
    // Load learnings + trends for AI context (memory system)
    // ============================================================
    let learnings: unknown[] = []
    let trends: Record<string, unknown> = {}
    try {
      const { data: learnData } = await supabase.rpc("guardian_get_learnings")
      if (learnData) learnings = learnData as unknown[]
      const { data: trendData } = await supabase.rpc("guardian_get_scan_trends", { p_days: 7 })
      if (trendData) trends = trendData as Record<string, unknown>
    } catch {
      // Non-critical: continue without memory context
    }

    // Record learnings from this scan's findings
    for (const evt of allEvents) {
      try {
        await supabase.rpc("guardian_record_learning", {
          p_category: evt.auto_action_taken ? "fix" : "pattern",
          p_module: evt.module,
          p_title: `${evt.check_name}: ${evt.description.slice(0, 100)}`,
          p_description: evt.description,
          p_context: { severity: evt.severity, auto_fixed: !!evt.auto_action_taken, scan_date: new Date().toISOString() },
        })
      } catch {
        // Non-critical
      }
    }

    // ============================================================
    // AI Heartbeat — Intelligent security assessment via GPT-4o-mini
    // ============================================================
    const aiAssessment = await generateAIHeartbeat({
      scanType,
      verdict,
      totalChecks,
      totalEvents,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      autoFixesApplied,
      modulesRun,
      events: allEvents.slice(0, 20),
      durationMs,
      learnings: learnings as Array<{ title: string; description: string; times_seen: number }>,
      trends,
    })

    if (aiAssessment) {
      await supabase
        .from("guardian_scan_results")
        .update({ ai_assessment: aiAssessment })
        .eq("id", scanId)
    }

    // ============================================================
    // EMAIL ALERT — Send when threats detected (CRITICAL or HIGH)
    // ============================================================
    const ADMIN_EMAIL = process.env.GUARDIAN_ALERT_EMAIL || process.env.ADMIN_EMAIL
    if (ADMIN_EMAIL && (criticalCount > 0 || highCount > 0)) {
      try {
        await sendGuardianAlertEmail({
          to: ADMIN_EMAIL,
          scanType,
          verdict,
          totalChecks,
          totalEvents,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          autoFixesApplied,
          modulesRun,
          events: allEvents.slice(0, 15),
          aiAssessment: aiAssessment ?? undefined,
          durationMs,
        })
        console.log(`[Guardian] Alert email sent to ${ADMIN_EMAIL}`)
      } catch (emailErr) {
        console.error("[Guardian] Failed to send alert email:", emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      scan_id: scanId,
      scan_type: scanType,
      duration_ms: durationMs,
      total_checks: totalChecks,
      events_found: totalEvents,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      auto_fixes: autoFixesApplied,
      verdict,
      modules_run: modulesRun,
      ai_assessment: aiAssessment,
    })
  } catch (error) {
    // Update scan record as failed
    await supabase
      .from("guardian_scan_results")
      .update({
        completed_at: new Date().toISOString(),
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", scanId)

    console.error("[Guardian] Scan failed:", error)
    return NextResponse.json(
      {
        success: false,
        scan_id: scanId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * Execute a guardian scan module RPC and return its result.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runModule(
  supabase: any,
  rpcName: string
): Promise<ScanModuleResult | null> {
  try {
    const { data, error } = await supabase.rpc(rpcName)
    if (error) {
      console.error(`[Guardian] Module ${rpcName} failed:`, error)
      return null
    }
    return data as ScanModuleResult
  } catch (err) {
    console.error(`[Guardian] Module ${rpcName} exception:`, err)
    return null
  }
}

/**
 * Count events by severity level.
 */
function countBySeverity(
  events: Array<{ severity: string }>
): Record<string, number> {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  }
  for (const evt of events) {
    if (evt.severity in counts) {
      counts[evt.severity]++
    }
  }
  return counts
}

/**
 * Generate AI-powered security assessment using GPT-4o-mini.
 * Analyzes scan results and produces a concise heartbeat report.
 */
async function generateAIHeartbeat(scanData: {
  scanType: string
  verdict: string
  totalChecks: number
  totalEvents: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  autoFixesApplied: number
  modulesRun: string[]
  events: ScanEvent[]
  durationMs: number
  learnings?: Array<{ title: string; description: string; times_seen: number }>
  trends?: Record<string, unknown>
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Guardian] No OPENAI_API_KEY — skipping AI heartbeat")
    return null
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const eventsContext = scanData.events
      .map(
        (e) =>
          `[${e.severity}] ${e.module}/${e.check_name}: ${e.description}${e.auto_action_taken ? ` (Auto-fix: ${e.auto_action_taken})` : ""}`
      )
      .join("\n")

    // Build memory context from learnings
    const learningsContext = scanData.learnings && scanData.learnings.length > 0
      ? `\n\nMemoria do Sentinel (aprendizados anteriores):\n${scanData.learnings.slice(0, 10).map(
          (l) => `- [${l.times_seen}x] ${l.title}`
        ).join("\n")}`
      : ""

    // Build trends context
    const trendsContext = scanData.trends
      ? `\n\nTendencias ultimos 7 dias: ${JSON.stringify(scanData.trends)}`
      : ""

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are Sentinel, a security guardian AI for a SaaS trading analytics platform (Trade AI Hub). You analyze automated security scan results and produce a concise heartbeat assessment in Portuguese (PT-BR).

You have persistent memory — learnings from past incidents and scan trends. Use this context to:
1. Identify recurring patterns (same issue appearing multiple scans)
2. Detect improvements or regressions compared to recent trends
3. Flag NEW issues that don't match known patterns (higher concern)
4. Recognize when a known auto-fixable pattern was successfully resolved

Your assessment must be:
- 2-4 sentences maximum
- Start with a status emoji: 🟢 (all clear), 🟡 (warnings), 🔴 (threats)
- Mention the most important finding if any
- Compare with recent trends if relevant (improving/degrading)
- End with a confidence level: [Confianca: ALTA/MEDIA/BAIXA]
- Be direct and actionable, no fluff`,
        },
        {
          role: "user",
          content: `Scan ${scanData.scanType} completado em ${scanData.durationMs}ms.
Modulos: ${scanData.modulesRun.join(", ")}
Checks: ${scanData.totalChecks} | Eventos: ${scanData.totalEvents}
CRITICAL: ${scanData.criticalCount} | HIGH: ${scanData.highCount} | MEDIUM: ${scanData.mediumCount} | LOW: ${scanData.lowCount}
Auto-fixes aplicados: ${scanData.autoFixesApplied}
Verdict: ${scanData.verdict}

${eventsContext ? `Eventos detectados:\n${eventsContext}` : "Nenhum evento detectado."}${learningsContext}${trendsContext}`,
        },
      ],
    })

    const assessment = response.choices[0]?.message?.content?.trim() || null
    if (assessment) {
      console.log(`[Guardian] AI Heartbeat: ${assessment}`)
    }
    return assessment
  } catch (err) {
    console.error("[Guardian] AI heartbeat failed:", err)
    return null
  }
}
