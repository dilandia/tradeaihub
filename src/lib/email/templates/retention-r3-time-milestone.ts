interface RetentionR3Params {
  userName?: string
  locale?: string
  months: number
}

export function retentionR3TimeMilestoneHtml(params: RetentionR3Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`
  const { months } = params

  const t = {
    preheader: isPt
      ? `${months} meses juntos! Sua jornada no trading esta evoluindo`
      : `${months} months together! Your trading journey is evolving`,
    heading: isPt ? `${months} Meses de Evolucao` : `${months} Months of Growth`,
    greeting: isPt ? `Parabens, ${name}!` : `Congratulations, ${name}!`,
    anniversary: isPt
      ? `${months} meses com Trade AI Hub`
      : `${months} months with Trade AI Hub`,
    message: isPt
      ? `${name}, hoje marca ${months} meses desde que voce comecou a usar o Trade AI Hub. Nesse tempo, voce transformou dados em conhecimento e decisoes em evolucao. Os traders mais bem-sucedidos da plataforma tem algo em comum: consistencia. E voce esta provando que tem essa qualidade.`
      : `${name}, today marks ${months} months since you started using Trade AI Hub. In that time, you've turned data into knowledge and decisions into growth. The most successful traders on the platform have one thing in common: consistency. And you're proving you have that quality.`,
    keepGoing: isPt ? `Continue assim!` : `Keep going!`,
    cta: isPt ? `Continuar Evoluindo` : `Keep Growing`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque completou ${months} meses no Trade AI Hub.`
      : `You received this email because you completed ${months} months on Trade AI Hub.`,
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
            <td style="padding:40px 40px 24px;text-align:center;">
              <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#e2e8f0;">${t.greeting}</p>
              <!-- Anniversary badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;border:1px solid #6366f133;">
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:48px;line-height:1;">&#127775;</p>
                    <p style="margin:0;font-size:36px;font-weight:800;color:#a855f7;">${months}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">${isPt ? "meses" : "months"}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#94a3b8;text-align:left;">${t.message}</p>
              <p style="margin:16px 0 0;font-size:16px;font-weight:600;color:#a855f7;">${t.keepGoing}</p>
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
