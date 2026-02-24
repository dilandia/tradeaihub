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
      ? `Voce usou 3 agentes em uma semana. Imagine com acesso completo`
      : `You used 3 agents in one week. Imagine with full access`,
    heading: isPt
      ? `Voce E Um Power User`
      : `You're a Power User`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `${name}, os numeros nao mentem: voce usou <strong style="color:#a855f7;">${params.agentCount}+ agentes de IA</strong> nos ultimos 7 dias. Isso te coloca no top 10% dos traders mais ativos na plataforma. Voce claramente entende o valor da analise com IA.`
      : `${name}, numbers don't lie: you've used <strong style="color:#a855f7;">${params.agentCount}+ AI agents</strong> in the last 7 days. That puts you in the top 10% of most active traders. You clearly understand the value of AI analysis.`,
    limitTitle: isPt
      ? `Voce esta usando a IA no limite...`
      : `You're pushing AI to its limits...`,
    limitText: isPt
      ? `Com esse ritmo, voce merece acesso completo. Sem limites de creditos, sem restricoes. Cada insight conta quando se trata do seu dinheiro.`
      : `At this pace, you deserve full access. No credit limits, no restrictions. Every insight matters when it's your money on the line.`,
    benefitTitle: isPt
      ? `O proximo nivel para Power Users:`
      : `The next level for Power Users:`,
    benefit1: isPt
      ? `Creditos ilimitados para usar IA todos os dias, sem contar`
      : `Unlimited credits to use AI every day, no counting`,
    benefit2: isPt
      ? `Acesso ao Copilot — chat em tempo real com a IA sobre seus trades`
      : `Access to Copilot — real-time AI chat about your trades`,
    benefit3: isPt
      ? `Compare periodos e veja sua evolucao mes a mes`
      : `Compare periods and see your month-over-month growth`,
    benefit4: isPt
      ? `Exportacao PDF para compartilhar e arquivar analises`
      : `PDF export to share and archive analyses`,
    cta: isPt
      ? `Virar Pro Agora`
      : `Go Pro Now`,
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
