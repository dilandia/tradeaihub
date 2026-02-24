interface ConversionC1Params {
  userName?: string
  locale?: string
  featureName: string
}

export function conversionC1FeatureGateHtml(params: ConversionC1Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Desbloqueie ${params.featureName} com o plano Pro`
      : `Unlock ${params.featureName} with the Pro plan`,
    heading: isPt
      ? `Desbloqueie Esta Funcionalidade`
      : `Unlock This Feature`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Voce tentou usar <strong style="color:#a855f7;">${params.featureName}</strong> — esta e uma funcionalidade exclusiva do plano Pro.`
      : `You tried to use <strong style="color:#a855f7;">${params.featureName}</strong> — this is a Pro feature.`,
    whyTitle: isPt
      ? `O que o Pro desbloqueia:`
      : `What Pro unlocks:`,
    benefit1: isPt
      ? `7 agentes de IA para analise completa do seu trading`
      : `7 AI agents for complete trading analysis`,
    benefit2: isPt
      ? `Exportacao PDF dos seus relatorios`
      : `PDF export of your reports`,
    benefit3: isPt
      ? `Estrategias e tags ilimitadas para organizar seus trades`
      : `Unlimited strategies and tags to organize your trades`,
    benefit4: isPt
      ? `5 contas de trading + conexao MetaTrader`
      : `5 trading accounts + MetaTrader connection`,
    compareTitle: isPt
      ? `Free vs Pro`
      : `Free vs Pro`,
    featureCol: isPt ? `Funcionalidade` : `Feature`,
    freeCol: `Free`,
    proCol: `Pro`,
    row1Label: isPt ? `Agentes de IA` : `AI Agents`,
    row1Free: isPt ? `Nenhum` : `None`,
    row1Pro: isPt ? `7 agentes` : `7 agents`,
    row2Label: isPt ? `Creditos IA/mes` : `AI Credits/mo`,
    row2Free: `0`,
    row2Pro: `60`,
    row3Label: isPt ? `Contas` : `Accounts`,
    row3Free: `1`,
    row3Pro: `5+`,
    row4Label: isPt ? `Exportacao PDF` : `PDF Export`,
    row4Free: `—`,
    row4Pro: `✓`,
    cta: isPt
      ? `Fazer Upgrade para Pro`
      : `Upgrade to Pro`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque tentou acessar uma funcionalidade Pro no Trade AI Hub.`
      : `You received this email because you tried to access a Pro feature on Trade AI Hub.`,
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
              <!-- Benefits -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.whyTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit3}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit4}</p>
                  </td>
                </tr>
              </table>
              <!-- Comparison Table -->
              <p style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.compareTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:4px 24px 4px;border-bottom:1px solid #334155;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;width:50%;">${t.featureCol}</td>
                        <td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;width:25%;text-align:center;">${t.freeCol}</td>
                        <td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a855f7;font-weight:600;width:25%;text-align:center;">${t.proCol}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#94a3b8;width:50%;border-bottom:1px solid #1e293b;">${t.row1Label}</td>
                        <td style="padding:8px 0;font-size:13px;color:#64748b;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row1Free}</td>
                        <td style="padding:8px 0;font-size:13px;color:#22c55e;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row1Pro}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#94a3b8;width:50%;border-bottom:1px solid #1e293b;">${t.row2Label}</td>
                        <td style="padding:8px 0;font-size:13px;color:#64748b;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row2Free}</td>
                        <td style="padding:8px 0;font-size:13px;color:#22c55e;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row2Pro}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#94a3b8;width:50%;border-bottom:1px solid #1e293b;">${t.row3Label}</td>
                        <td style="padding:8px 0;font-size:13px;color:#64748b;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row3Free}</td>
                        <td style="padding:8px 0;font-size:13px;color:#22c55e;width:25%;text-align:center;border-bottom:1px solid #1e293b;">${t.row3Pro}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#94a3b8;width:50%;">${t.row4Label}</td>
                        <td style="padding:8px 0;font-size:13px;color:#64748b;width:25%;text-align:center;">${t.row4Free}</td>
                        <td style="padding:8px 0;font-size:13px;color:#22c55e;width:25%;text-align:center;">${t.row4Pro}</td>
                      </tr>
                    </table>
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
                    <a href="${subscriptionUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
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
