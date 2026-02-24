interface RetentionR1Params {
  userName?: string
  locale?: string
  stats: {
    tradesAnalyzed: number
    aiInsights: number
    creditsUsed: number
    strategiesActive: number
    takerzScore: number
    prevScore?: number
  }
}

export function retentionR1MonthlyUsageHtml(params: RetentionR1Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`
  const { stats } = params

  const scoreDiff = stats.prevScore != null ? stats.takerzScore - stats.prevScore : null
  const scoreArrow = scoreDiff != null ? (scoreDiff > 0 ? "&#9650;" : scoreDiff < 0 ? "&#9660;" : "&#8212;") : ""
  const scoreColor = scoreDiff != null ? (scoreDiff > 0 ? "#22c55e" : scoreDiff < 0 ? "#ef4444" : "#94a3b8") : "#94a3b8"
  const scoreDiffText = scoreDiff != null ? (scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`) : ""

  const t = {
    preheader: isPt
      ? `Seu mes em numeros: trades analisados, insights gerados, evolucao real`
      : `Your month in numbers: trades analyzed, insights generated, real growth`,
    heading: isPt ? `Seu Mes Em Numeros` : `Your Month In Numbers`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `${name}, mais um mes de evolucao no trading. Vamos ver o que voce conquistou?`
      : `${name}, another month of trading growth. Let's see what you've accomplished?`,
    tradesLabel: isPt ? `Trades Analisados` : `Trades Analyzed`,
    insightsLabel: isPt ? `Insights de IA` : `AI Insights`,
    creditsLabel: isPt ? `Creditos Usados` : `Credits Used`,
    strategiesLabel: isPt ? `Estrategias Ativas` : `Active Strategies`,
    scoreTitle: isPt ? `TakeZ Score` : `TakeZ Score`,
    scoreTrend: isPt ? `vs mes anterior` : `vs last month`,
    cta: isPt ? `Ver Dashboard Completo` : `View Full Dashboard`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email como parte do seu resumo mensal.`
      : `You received this email as part of your monthly summary.`,
  }

  const statCard = (label: string, value: string | number) => `
    <td style="padding:8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
        <tr>
          <td style="padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#e2e8f0;">${value}</p>
            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
          </td>
        </tr>
      </table>
    </td>`

  return `<!DOCTYPE html>
<html lang="${isPt ? "pt-BR" : "en"}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${t.heading}</title>
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
  <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${t.preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121212;border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 50%,#a855f7 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Trade AI Hub</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">${t.heading}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e2e8f0;">${t.greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.intro}</p>
              <!-- Stats Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${statCard(t.tradesLabel, stats.tradesAnalyzed)}
                  ${statCard(t.insightsLabel, stats.aiInsights)}
                </tr>
                <tr>
                  ${statCard(t.creditsLabel, stats.creditsUsed)}
                  ${statCard(t.strategiesLabel, stats.strategiesActive)}
                </tr>
              </table>
              <!-- TakeZ Score -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background-color:#1e293b;border-radius:8px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">${t.scoreTitle}</p>
                    <p style="margin:0;font-size:36px;font-weight:700;color:#a855f7;">${stats.takerzScore}</p>
                    ${scoreDiff != null ? `<p style="margin:4px 0 0;font-size:13px;color:${scoreColor};">${scoreArrow} ${scoreDiffText} ${t.scoreTrend}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#1e293b;"></div></td></tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;">${t.footer}</p>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">${t.footerSub}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
