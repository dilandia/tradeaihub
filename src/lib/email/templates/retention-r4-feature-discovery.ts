interface RetentionR4Params {
  userName?: string
  locale?: string
  featureName: string
  featureDescription: string
  featureUrl: string
}

export function retentionR4FeatureDiscoveryHtml(params: RetentionR4Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const { featureName, featureDescription, featureUrl } = params

  const t = {
    preheader: isPt
      ? `Tem uma funcionalidade escondida no seu plano que voce ainda nao experimentou`
      : `There's a hidden feature in your plan you haven't tried yet`,
    heading: isPt ? `Voce Sabia Disso?` : `Did You Know This?`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `${name}, depois de analisar como voce usa o Trade AI Hub, percebemos que tem funcionalidades poderosas que voce ainda nao experimentou. Elas podem mudar a forma como voce analisa seus trades.`
      : `${name}, after analyzing how you use Trade AI Hub, we noticed powerful features you haven't tried yet. They could change how you analyze your trades.`,
    featureLabel: featureName,
    featureDesc: featureDescription,
    howToTitle: isPt ? `Como usar:` : `How to use:`,
    howTo: isPt
      ? `Acesse seu dashboard e navegue ate a funcionalidade. E simples e leva menos de 1 minuto para comecar.`
      : `Go to your dashboard and navigate to the feature. It's simple and takes less than 1 minute to get started.`,
    cta: isPt ? `Descobrir Agora` : `Discover Now`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque tem uma conta no Trade AI Hub.`
      : `You received this email because you have an account on Trade AI Hub.`,
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
              <!-- Feature card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:4px solid #a855f7;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">&#128161; ${isPt ? "Funcionalidade" : "Feature"}</p>
                    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#e2e8f0;">${t.featureLabel}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">${t.featureDesc}</p>
                  </td>
                </tr>
              </table>
              <!-- How to use -->
              <p style="margin:24px 0 8px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.howToTitle}</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">${t.howTo}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${featureUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
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
