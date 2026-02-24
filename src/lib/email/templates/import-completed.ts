interface ImportCompletedParams {
  userName?: string
  locale?: string
  tradeCount: number
  accountName: string
}

export function importCompletedEmailHtml(params: ImportCompletedParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `${params.tradeCount} trades prontos para a IA analisar. Os padroes ja estao aparecendo`
      : `${params.tradeCount} trades ready for AI analysis. Patterns are already emerging`,
    heading: isPt
      ? `Importacao Completa!`
      : `Import Complete!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Pronto! Seus trades ja estao no sistema e a IA esta processando os dados. Aqui esta o resumo:`
      : `Done! Your trades are in the system and AI is processing the data. Here's the summary:`,
    labelAccount: isPt ? `Conta` : `Account`,
    labelTrades: isPt ? `Trades importados` : `Trades imported`,
    teaser: isPt
      ? `Seu dashboard esta turbinado com dados frescos. Os agentes de IA ja podem gerar insights personalizados — quanto antes voce acessar, mais rapido descobre padroes escondidos.`
      : `Your dashboard is loaded with fresh data. AI agents can now generate personalized insights — the sooner you access, the faster you discover hidden patterns.`,
    cta: isPt
      ? `Explorar Meus Dados`
      : `Explore My Data`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque importou trades no Trade AI Hub.`
      : `You received this email because you imported trades on Trade AI Hub.`,
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
              <!-- Import details card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #334155;">
                    <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">${t.labelAccount}</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#a855f7;">${params.accountName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">${t.labelTrades}</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#22c55e;">${params.tradeCount}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#94a3b8;">${t.teaser}</p>
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
