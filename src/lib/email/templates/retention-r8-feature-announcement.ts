interface RetentionR8Params {
  userName?: string
  locale?: string
  featureTitle: string
  featureDescription: string
  ctaUrl: string
  ctaText?: string
}

export function retentionR8FeatureAnnouncementHtml(params: RetentionR8Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const ctaUrl = params.ctaUrl.startsWith("http") ? params.ctaUrl : `${appUrl}${params.ctaUrl}`
  const ctaText = params.ctaText || (isPt ? "Experimentar Agora" : "Try It Now")

  const t = {
    preheader: isPt
      ? `Novidade no Trade AI Hub: ${params.featureTitle}`
      : `What's new on Trade AI Hub: ${params.featureTitle}`,
    heading: isPt
      ? `Novidades`
      : `What's New`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Acabamos de lancar algo que vai melhorar sua experiencia de trading. Veja o que ha de novo:`
      : `We just shipped something that will improve your trading experience. Here's what's new:`,
    howToUse: isPt ? `Como usar:` : `How to use it:`,
    howToUseText: isPt
      ? `Acesse sua conta no Trade AI Hub e explore a nova funcionalidade. Ela ja esta disponivel e pronta para uso.`
      : `Log in to your Trade AI Hub account and explore the new feature. It's already available and ready to use.`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque esta inscrito em atualizacoes de produto do Trade AI Hub.`
      : `You received this email because you're subscribed to product updates from Trade AI Hub.`,
  }

  return `<!DOCTYPE html>
<html lang="${isPt ? "pt-BR" : "en"}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${t.heading}: ${params.featureTitle}</title>
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
            <td style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 50%,#15803d 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Trade AI Hub</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:400;">${t.heading}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e2e8f0;">${t.greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.intro}</p>
              <!-- Feature highlight -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:3px solid #22c55e;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#e2e8f0;">${params.featureTitle}</h2>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#94a3b8;">${params.featureDescription}</p>
                  </td>
                </tr>
              </table>
              <!-- How to use -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.howToUse}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">${t.howToUseText}</p>
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
                  <td style="border-radius:8px;background:linear-gradient(to right,#22c55e,#16a34a);">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaText}</a>
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
