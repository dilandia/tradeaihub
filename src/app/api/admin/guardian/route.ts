import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"
import { getPool } from "@/lib/db"
import OpenAI from "openai"

/**
 * POST /api/admin/guardian — Trigger manual Guardian scan
 * Requires admin authentication via session cookie.
 */
export async function POST(req: NextRequest) {
  // Verify admin auth
  const admin = await verifyAdmin()

  const pool = getPool()
  const scanType =
    req.nextUrl.searchParams.get("type") === "quick" ? "quick" : "full"
  const startedAt = new Date()

  // Create scan record
  let scanId: string
  try {
    const { rows } = await pool.query(
      `INSERT INTO guardian_scan_results (scan_type, started_at, status)
       VALUES ($1, $2, 'running') RETURNING id`,
      [scanType, startedAt.toISOString()]
    )
    scanId = rows[0]?.id
    if (!scanId) throw new Error("No scan ID returned")
  } catch (scanError) {
    return NextResponse.json(
      { error: "Failed to initialize scan" },
      { status: 500 }
    )
  }

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
        const { rows } = await pool.query(`SELECT * FROM ${rpcName}()`)
        const data = rows[0] ?? null
        if (!data) continue

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
      for (const evt of allEvents) {
        await pool.query(
          `INSERT INTO security_events
           (scan_id, severity, module, check_name, description, details, auto_action_taken)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            scanId,
            evt.severity,
            evt.module,
            evt.check_name,
            evt.description,
            JSON.stringify(evt.details || {}),
            evt.auto_action_taken || null,
          ]
        )
      }
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

    await pool.query(
      `UPDATE guardian_scan_results SET
         completed_at = $1, duration_ms = $2, modules_run = $3,
         total_checks = $4, events_found = $5, critical_count = $6,
         high_count = $7, medium_count = $8, low_count = $9,
         auto_fixes_applied = $10, status = 'completed',
         ai_assessment = $11, summary = $12
       WHERE id = $13`,
      [
        completedAt.toISOString(),
        durationMs,
        JSON.stringify(modulesRun),
        totalChecks,
        totalEvents,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        autoFixesApplied,
        aiAssessment,
        JSON.stringify({
          scan_type: scanType,
          modules: modulesRun.length,
          verdict,
          triggered_by: admin.email,
        }),
        scanId,
      ]
    )

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
    await pool.query(
      `UPDATE guardian_scan_results SET
         completed_at = $1, status = 'failed', error_message = $2
       WHERE id = $3`,
      [
        new Date().toISOString(),
        error instanceof Error ? error.message : "Unknown error",
        scanId,
      ]
    )

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    )
  }
}
