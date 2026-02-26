interface GuardianAlertEmailParams {
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
  events: Array<{
    severity: string
    module: string
    check_name: string
    description: string
    auto_action_taken?: string
  }>
  aiAssessment?: string
  durationMs: number
}

export function guardianAlertEmailHtml(params: GuardianAlertEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const adminUrl = `${appUrl}/admin/system`

  const statusEmoji = params.criticalCount > 0 ? "🔴" : params.highCount > 0 ? "🟡" : "🟢"
  const statusColor = params.criticalCount > 0 ? "#ef4444" : params.highCount > 0 ? "#f59e0b" : "#22c55e"
  const statusText = params.criticalCount > 0 ? "AMEACAS DETECTADAS" : params.highCount > 0 ? "ALERTAS" : "TUDO LIMPO"

  const eventsHtml = params.events.length > 0
    ? params.events.slice(0, 15).map((evt) => {
        const sevColor = evt.severity === "CRITICAL" ? "#ef4444"
          : evt.severity === "HIGH" ? "#f59e0b"
          : evt.severity === "MEDIUM" ? "#3b82f6"
          : "#6b7280"
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #1e293b;">
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;background-color:${sevColor}20;color:${sevColor};font-size:11px;font-weight:700;">
                ${evt.severity}
              </span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px;">
              ${evt.description}
              ${evt.auto_action_taken ? `<br><span style="color:#22c55e;font-size:11px;">Auto-fix: ${evt.auto_action_taken}</span>` : ""}
            </td>
          </tr>`
      }).join("")
    : `<tr><td colspan="2" style="padding:16px;text-align:center;color:#22c55e;font-size:14px;">Nenhum evento detectado. Sistema seguro.</td></tr>`

  return `<!DOCTYPE html>
<html lang="pt-BR" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Sentinel Security Alert</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${statusEmoji} Guardian Scan: ${statusText} | ${params.totalEvents} eventos | ${params.autoFixesApplied} auto-fixes
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121212;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${statusColor} 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Sentinel Security Report
              </h1>
              <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.9);font-weight:600;">
                ${statusEmoji} ${statusText}
              </p>
            </td>
          </tr>
          <!-- Stats -->
          <tr>
            <td style="padding:24px 40px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:12px;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#e2e8f0;">${params.totalChecks}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;">Checks</p>
                  </td>
                  <td style="text-align:center;padding:12px;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:${params.totalEvents > 0 ? "#f59e0b" : "#22c55e"};">${params.totalEvents}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;">Eventos</p>
                  </td>
                  <td style="text-align:center;padding:12px;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#22c55e;">${params.autoFixesApplied}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;">Auto-fixes</p>
                  </td>
                  <td style="text-align:center;padding:12px;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#94a3b8;">${params.durationMs}ms</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;">Duracao</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Severity breakdown -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                <tr>
                  <td style="padding:12px;text-align:center;">
                    <span style="color:#ef4444;font-weight:700;font-size:14px;">CRITICAL: ${params.criticalCount}</span>
                  </td>
                  <td style="padding:12px;text-align:center;">
                    <span style="color:#f59e0b;font-weight:700;font-size:14px;">HIGH: ${params.highCount}</span>
                  </td>
                  <td style="padding:12px;text-align:center;">
                    <span style="color:#3b82f6;font-weight:700;font-size:14px;">MEDIUM: ${params.mediumCount}</span>
                  </td>
                  <td style="padding:12px;text-align:center;">
                    <span style="color:#6b7280;font-weight:700;font-size:14px;">LOW: ${params.lowCount}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- AI Assessment -->
          ${params.aiAssessment ? `
          <tr>
            <td style="padding:0 40px 16px;">
              <div style="background-color:#1e293b;border-radius:8px;padding:16px;border-left:3px solid ${statusColor};">
                <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600;">AI Assessment</p>
                <p style="margin:0;font-size:14px;line-height:1.5;color:#e2e8f0;">
                  ${params.aiAssessment}
                </p>
              </div>
            </td>
          </tr>` : ""}
          <!-- Events table -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#e2e8f0;">Eventos Detectados</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;overflow:hidden;">
                ${eventsHtml}
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${adminUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Ver Painel Admin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Modules -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0;font-size:12px;color:#475569;">
                Modulos executados: ${params.modulesRun.join(", ")} | Scan: ${params.scanType}
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e293b;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;">
                Sentinel — Trade AI Hub Security Guardian
              </p>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">
                Este email e enviado automaticamente quando o scan detecta ameacas ou eventos de seguranca.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
