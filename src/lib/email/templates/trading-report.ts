interface TradingReportEmailParams {
  userName?: string
  locale?: string
  period: "weekly" | "monthly"
  startDate: string
  endDate: string
  metrics: {
    totalTrades: number
    wins: number
    losses: number
    winRate: number
    netDollar: number
    profitFactor: number
    bestTradePnl: number
    worstTradePnl: number
    zellaScore: number
  }
}

function formatCurrency(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function tradingReportEmailHtml(
  params: TradingReportEmailParams
): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const reportsUrl = `${appUrl}/reports`
  const settingsUrl = `${appUrl}/settings/notifications`

  const periodLabel = isPt
    ? params.period === "weekly"
      ? "Semanal"
      : "Mensal"
    : params.period === "weekly"
      ? "Weekly"
      : "Monthly"

  const { metrics } = params
  const winRateColor = metrics.winRate >= 50 ? "#22c55e" : "#ef4444"
  const netColor = metrics.netDollar >= 0 ? "#22c55e" : "#ef4444"
  const scoreColor =
    metrics.zellaScore >= 70
      ? "#22c55e"
      : metrics.zellaScore >= 40
        ? "#eab308"
        : "#ef4444"

  const t = {
    preheader: isPt
      ? `Seu Relatorio ${periodLabel} de Trading — Trade AI Hub`
      : `Your ${periodLabel} Trading Report — Trade AI Hub`,
    heading: isPt
      ? `Relatorio ${periodLabel} de Trading`
      : `${periodLabel} Trading Report`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `Aqui esta o resumo da sua atividade de trading de ${params.startDate} a ${params.endDate}.`
      : `Here's your trading activity summary from ${params.startDate} to ${params.endDate}.`,
    summaryTitle: isPt
      ? `Resumo de Trading`
      : `Your Trading Summary`,
    totalTrades: isPt ? `Total de Trades` : `Total Trades`,
    winsLosses: isPt ? `Vitorias / Derrotas` : `Wins / Losses`,
    winRate: isPt ? `Win Rate` : `Win Rate`,
    netPnl: isPt ? `P&L Liquido` : `Net P&L`,
    profitFactor: isPt ? `Profit Factor` : `Profit Factor`,
    bestTrade: isPt ? `Melhor Trade` : `Best Trade`,
    worstTrade: isPt ? `Pior Trade` : `Worst Trade`,
    takezScore: isPt ? `TakeZ Score` : `TakeZ Score`,
    cta: isPt ? `Ver Relatorio Completo` : `View Full Report`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque habilitou relatorios periodicos.`
      : `You received this email because you enabled periodic reports.`,
    unsubscribe: isPt
      ? `Cancelar inscricao`
      : `Unsubscribe`,
  }

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
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${t.preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121212;border-radius:12px;overflow:hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 50%,#a855f7 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Trade AI Hub
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">
                ${t.heading}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e2e8f0;">
                ${t.greeting}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                ${t.intro}
              </p>
              <!-- Summary Title -->
              <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#e2e8f0;">
                ${t.summaryTitle}
              </p>
              <!-- Metrics Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <!-- Row 1: Total Trades | Win Rate -->
                <tr>
                  <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.totalTrades}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:#e2e8f0;">${metrics.totalTrades}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.winRate}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:${winRateColor};">${formatPercent(metrics.winRate)}</p>
                    </div>
                  </td>
                </tr>
                <!-- Row 2: Wins/Losses | Net P&L -->
                <tr>
                  <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.winsLosses}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:#e2e8f0;">
                        <span style="color:#22c55e;">${metrics.wins}</span>
                        <span style="color:#64748b;font-size:16px;"> / </span>
                        <span style="color:#ef4444;">${metrics.losses}</span>
                      </p>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.netPnl}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:${netColor};">${formatCurrency(metrics.netDollar)}</p>
                    </div>
                  </td>
                </tr>
                <!-- Row 3: Profit Factor | TakeZ Score -->
                <tr>
                  <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.profitFactor}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:#e2e8f0;">${metrics.profitFactor.toFixed(2)}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.takezScore}</p>
                      <p style="margin:0;font-size:24px;font-weight:700;color:${scoreColor};">${metrics.zellaScore.toFixed(0)}</p>
                    </div>
                  </td>
                </tr>
                <!-- Row 4: Best Trade | Worst Trade -->
                <tr>
                  <td width="50%" style="padding:8px 8px 8px 0;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.bestTrade}</p>
                      <p style="margin:0;font-size:20px;font-weight:700;color:#22c55e;">${formatCurrency(metrics.bestTradePnl)}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:8px 0 8px 8px;vertical-align:top;">
                    <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${t.worstTrade}</p>
                      <p style="margin:0;font-size:20px;font-weight:700;color:#ef4444;">${formatCurrency(metrics.worstTradePnl)}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${reportsUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
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
                ${t.footer}
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#475569;line-height:1.5;">
                ${t.footerSub}
              </p>
              <a href="${settingsUrl}" target="_blank" style="font-size:12px;color:#6366f1;text-decoration:underline;">
                ${t.unsubscribe}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
