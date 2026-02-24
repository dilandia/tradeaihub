interface OnboardingO6Params {
  userName?: string
  locale?: string
  stats?: {
    tradesAnalyzed?: number
    insightsGenerated?: number
    daysActive?: number
  }
}

export function onboardingO6WeekSummaryHtml(params: OnboardingO6Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`
  const hasStats = params.stats && (params.stats.tradesAnalyzed || params.stats.insightsGenerated || params.stats.daysActive)

  const t = {
    preheader: isPt
      ? `10 dias usando o Trade AI Hub — veja o que voce conquistou`
      : `10 days on Trade AI Hub — see what you've achieved`,
    heading: isPt
      ? `Sua Primeira Semana`
      : `Your First Week`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Ja faz 10 dias desde que voce comecou! Independente de quanto voce usou ate agora, cada passo conta. Vamos recapitular o que esta disponivel para voce:`
      : `It's been 10 days since you started! Regardless of how much you've used so far, every step counts. Let's recap what's available to you:`,
    statsTitle: isPt
      ? `Seu Progresso:`
      : `Your Progress:`,
    statTrades: isPt ? `Trades Analisados` : `Trades Analyzed`,
    statInsights: isPt ? `Insights Gerados` : `Insights Generated`,
    statDays: isPt ? `Dias Ativos` : `Days Active`,
    noStatsMessage: isPt
      ? `Comece importando seus trades para ver suas estatisticas aqui!`
      : `Start importing your trades to see your stats here!`,
    tipsTitle: isPt
      ? `Dicas para aproveitar mais:`
      : `Tips to get more out of it:`,
    tip1: isPt
      ? `Use o Copilot Chat para perguntas especificas sobre seu trading`
      : `Use Copilot Chat for specific questions about your trading`,
    tip2: isPt
      ? `Crie estrategias para categorizar e comparar seus trades`
      : `Create strategies to categorize and compare your trades`,
    tip3: isPt
      ? `Adicione tags aos trades para analises mais detalhadas`
      : `Add tags to trades for more detailed analysis`,
    upgradeTitle: isPt
      ? `Pronto para mais?`
      : `Ready for more?`,
    upgradeDesc: isPt
      ? `Upgrade para o Pro e desbloqueie analises ilimitadas, mais contas e recursos avancados.`
      : `Upgrade to Pro and unlock unlimited analyses, more accounts, and advanced features.`,
    cta: isPt
      ? `Continuar Minha Evolucao`
      : `Continue My Growth`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque criou uma conta no Trade AI Hub.`
      : `You received this email because you created an account on Trade AI Hub.`,
  }

  const statsSection = hasStats
    ? `<!-- Stats cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="padding:0 4px 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                      <tr>
                        <td style="padding:16px;text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:700;color:#6366f1;">${params.stats?.tradesAnalyzed ?? 0}</p>
                          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;">${t.statTrades}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding:0 2px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                      <tr>
                        <td style="padding:16px;text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:700;color:#a855f7;">${params.stats?.insightsGenerated ?? 0}</p>
                          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;">${t.statInsights}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding:0 0 0 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                      <tr>
                        <td style="padding:16px;text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:700;color:#22c55e;">${params.stats?.daysActive ?? 0}</p>
                          <p style="margin:4px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;">${t.statDays}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
    : `<!-- No stats message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.noStatsMessage}</p>
                  </td>
                </tr>
              </table>`

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
              <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.statsTitle}</p>
              ${statsSection}
              <!-- Tips -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.tipsTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;">
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">&#8226; ${t.tip1}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">&#8226; ${t.tip2}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">&#8226; ${t.tip3}</p>
                  </td>
                </tr>
              </table>
              <!-- Upgrade pitch -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:3px solid #a855f7;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#e2e8f0;">${t.upgradeTitle}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.upgradeDesc}</p>
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
