interface ConversionC7Params {
  userName?: string
  locale?: string
}

export function conversionC7SocialProofHtml(params: ConversionC7Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Veja por que traders estao fazendo upgrade para o Pro`
      : `See why traders are upgrading to Pro`,
    heading: isPt
      ? `Traders Estao Fazendo Upgrade`
      : `Traders Are Upgrading`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Traders que levam seus resultados a serio estao usando IA para encontrar padroes que passariam despercebidos. Veja o que eles estao dizendo:`
      : `Traders who are serious about their results are using AI to find patterns they'd otherwise miss. Here's what they're saying:`,
    stat1: isPt
      ? `87% dos traders ativos dizem que insights de IA melhoraram seus resultados`
      : `87% of active traders say AI insights improved their results`,
    stat2: isPt
      ? `Traders que fizeram upgrade analisam 3x mais operacoes`
      : `Traders who upgraded analyze 3x more trades`,
    stat3: isPt
      ? `Usuarios Pro descobrem 5x mais padroes em seus trades`
      : `Pro users discover 5x more patterns in their trades`,
    whyTitle: isPt ? `Por que traders escolhem o Pro:` : `Why traders choose Pro:`,
    why1: isPt
      ? `Insights de IA identificam erros recorrentes automaticamente`
      : `AI insights identify recurring mistakes automatically`,
    why2: isPt
      ? `Deteccao de padroes revela oportunidades escondidas`
      : `Pattern detection reveals hidden opportunities`,
    why3: isPt
      ? `Analise de risco protege seu capital em tempo real`
      : `Risk analysis protects your capital in real time`,
    why4: isPt
      ? `Copilot responde suas duvidas de trading com IA`
      : `Copilot answers your trading questions with AI`,
    cta: isPt ? `Ver Beneficios do Pro` : `See Pro Benefits`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque esta no plano Free do Trade AI Hub.`
      : `You received this email because you're on the Free plan of Trade AI Hub.`,
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
              <!-- Stats cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#1e293b;border-radius:8px;margin-bottom:8px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#e2e8f0;text-align:center;">
                      <span style="font-size:32px;font-weight:700;color:#a855f7;display:block;margin-bottom:4px;">87%</span>
                      ${t.stat1}
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td width="48%" style="padding:16px 16px;background-color:#1e293b;border-radius:8px;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#e2e8f0;text-align:center;">
                      <span style="font-size:28px;font-weight:700;color:#6366f1;display:block;margin-bottom:4px;">3x</span>
                      ${t.stat2}
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding:16px 16px;background-color:#1e293b;border-radius:8px;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#e2e8f0;text-align:center;">
                      <span style="font-size:28px;font-weight:700;color:#22c55e;display:block;margin-bottom:4px;">5x</span>
                      ${t.stat3}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Why Pro -->
              <p style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.whyTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.why1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.why2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.why3}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.why4}</p>
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
