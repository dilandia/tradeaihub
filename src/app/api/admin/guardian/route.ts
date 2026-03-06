import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import OpenAI from "openai"

function getServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/admin/guardian — Trigger manual Guardian scan
 * Requires admin authentication via session cookie.
 */
export async function POST(req: NextRequest) {
  // Verify admin auth
  const supabase = await createServerClient()
  let user = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    user = session?.user ?? null
  } catch {
    // Auth check failed silently — user remains null
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.role === "super_admin"

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const scanType =
    req.nextUrl.searchParams.get("type") === "quick" ? "quick" : "full"
  const serviceClient = getServiceClient()
  const startedAt = new Date()

  // Create scan record
  const { data: scanRecord, error: scanError } = await serviceClient
    .from("guardian_scan_results")
    .insert({
      scan_type: scanType,
      started_at: startedAt.toISOString(),
      status: "running",
    })
    .select("id")
    .single()

  if (scanError || !scanRecord) {
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

  interface ScanEvent {
    severity: string
    module: string
    check_name: string
    description: string
    details: Record<string, unknown>
    auto_action_taken?: string
  }

  const allEvents: ScanEvent[] = []

  try {
    // Run all scan modules
    const modules =
      scanType === "quick"
        ? ["guardian_run_credit_anomaly_check", "guardian_run_rpc_permission_audit"]
        : [
            "guardian_run_credit_anomaly_check",
            "guardian_run_rpc_permission_audit",
            "guardian_run_rls_audit",
            "guardian_run_grant_audit",
            "guardian_run_function_security_audit",
          ]

    const moduleNames: Record<string, string> = {
      guardian_run_credit_anomaly_check: "credit_anomaly",
      guardian_run_rpc_permission_audit: "rpc_permissions",
      guardian_run_rls_audit: "rls_audit",
      guardian_run_grant_audit: "grant_audit",
      guardian_run_function_security_audit: "function_security",
    }

    for (const rpcName of modules) {
      try {
        const { data, error } = await serviceClient.rpc(rpcName)
        if (error || !data) continue

        const result = data as {
          events: ScanEvent[]
          checks: number
          issues: number
        }
        modulesRun.push(moduleNames[rpcName] || rpcName)
        totalChecks += result.checks
        totalEvents += result.issues
        allEvents.push(...result.events)

        for (const evt of result.events) {
          const sev = evt.severity
          if (sev === "CRITICAL") criticalCount++
          else if (sev === "HIGH") highCount++
          else if (sev === "MEDIUM") mediumCount++
          else if (sev === "LOW") lowCount++
        }
      } catch {
        // Module failed, continue
      }
    }

    // Store events
    if (allEvents.length > 0) {
      await serviceClient.from("security_events").insert(
        allEvents.map((evt) => ({
          scan_id: scanId,
          severity: evt.severity,
          module: evt.module,
          check_name: evt.check_name,
          description: evt.description,
          details: evt.details || {},
          auto_action_taken: evt.auto_action_taken || null,
        }))
      )
    }

    // Update scan record
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt.getTime()
    const verdict =
      criticalCount > 0
        ? "THREATS_DETECTED"
        : highCount > 0
          ? "WARNINGS"
          : "ALL_CLEAR"

    // AI Heartbeat
    let aiAssessment: string | null = null
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const eventsCtx = allEvents
          .slice(0, 20)
          .map(
            (e) =>
              `[${e.severity}] ${e.module}/${e.check_name}: ${e.description}`
          )
          .join("\n")

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 300,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You are Sentinel, a security guardian AI for Trade AI Hub (SaaS). Analyze scan results and produce a concise PT-BR heartbeat: 2-4 sentences, start with 🟢/🟡/🔴, end with [Confianca: ALTA/MEDIA/BAIXA].`,
            },
            {
              role: "user",
              content: `Scan ${scanType} manual (admin trigger) em ${durationMs}ms. Modulos: ${modulesRun.join(", ")}. Checks: ${totalChecks}, Eventos: ${totalEvents}. CRITICAL:${criticalCount} HIGH:${highCount} MEDIUM:${mediumCount}. Verdict: ${verdict}.\n${eventsCtx || "Nenhum evento."}`,
            },
          ],
        })
        aiAssessment = response.choices[0]?.message?.content?.trim() || null
      } catch {
        // AI failed, continue without
      }
    }

    await serviceClient
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
        ai_assessment: aiAssessment,
        summary: {
          scan_type: scanType,
          modules: modulesRun.length,
          verdict,
          triggered_by: user.email,
        },
      })
      .eq("id", scanId)

    return NextResponse.json({
      success: true,
      scan_id: scanId,
      verdict:
        criticalCount > 0
          ? "THREATS DETECTED"
          : highCount > 0
            ? "WARNINGS"
            : "ALL CLEAR",
      total_checks: totalChecks,
      events_found: totalEvents,
      duration_ms: durationMs,
      ai_assessment: aiAssessment,
    })
  } catch (error) {
    await serviceClient
      .from("guardian_scan_results")
      .update({
        completed_at: new Date().toISOString(),
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", scanId)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    )
  }
}
