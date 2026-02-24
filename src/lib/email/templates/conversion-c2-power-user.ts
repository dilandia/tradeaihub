interface ConversionC2Params {
  userName?: string
  locale?: string
  agentCount: number
}

export function conversionC2PowerUserHtml(params: ConversionC2Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Voce usou ${params.agentCount} agentes de IA esta semana — impressionante!`
      : `You used ${params.agentCount} AI agents this week — impressive!`,
    heading: isPt
      ? `Voce e um Power User!`
      : `You're a Power User!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Voce usou <strong style="color:#a855f7;">${params.agentCount} agentes de IA</strong> diferentes esta semana — impressionante! Voce esta aproveitando ao maximo a analise de trading com IA.`
      : `You've used <strong style="color:#a855f7;">${params.agentCount} different AI agents</strong> this week — impressive! You're making the most of AI-powered trading analysis.`,
    limitTitle: isPt
      ? `Mas no plano Free, seus creditos sao limitados...`
      : `But on the Free plan, your credits are limited...`,
    limitText: isPt
      ? `Com esse ritmo de uso, seus creditos podem acabar rapidamente. O plano Pro garante que voce nunca fique sem analise.`
      : `At this pace, your credits may run out quickly. The Pro plan ensures you never run out of analysis.`,
    benefitTitle: isPt
      ? `Beneficios Pro para Power Users:`
      : `Pro benefits for Power Users:`,
    benefit1: isPt
      ? `60 creditos de IA por mes (vs 0 no Free)`
      : `60 AI credits per month (vs 0 on Free)`,
    benefit2: isPt
      ? `Acesso prioritario a todos os 7 agentes de IA`
      : `Priority access to all 7 AI agents`,
    benefit3: isPt
      ? `Estrategias e tags ilimitadas para rastrear padroes`
      : `Unlimited strategies and tags to track patterns`,
    benefit4: isPt
      ? `Exportacao PDF para compartilhar e arquivar analises`
      : `PDF export to share and archive analyses`,
    cta: isPt
      ? `Fazer Upgrade para Pro`
      : `Upgrade to Pro`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque e um usuario ativo dos agentes de IA no Trade AI Hub.`
      : `You received this email because you're an active user of AI agents on Trade AI Hub.`,
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
              <!-- Limit warning -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;border-left:4px solid #f59e0b;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#f59e0b;">${t.limitTitle}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">${t.limitText}</p>
                  </td>
                </tr>
              </table>
              <!-- Benefits -->
              <p style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.benefitTitle}</p>
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
