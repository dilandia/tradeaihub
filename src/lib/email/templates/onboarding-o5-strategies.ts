interface OnboardingO5Params {
  userName?: string
  locale?: string
}

export function onboardingO5StrategiesHtml(params: OnboardingO5Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `Organize seus trades por estrategia e descubra o que funciona melhor`
      : `Organize your trades by strategy and discover what works best`,
    heading: isPt
      ? `Rastreie Suas Estrategias`
      : `Track Your Strategies`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Traders profissionais sabem exatamente quais estrategias funcionam. Com o Trade AI Hub, voce tambem pode.`
      : `Professional traders know exactly which strategies work. With Trade AI Hub, so can you.`,
    feature1Title: isPt ? `Crie Estrategias` : `Create Strategies`,
    feature1Desc: isPt
      ? `Crie estrategias personalizadas para categorizar seus trades — scalping, swing, breakout, ou qualquer uma que voce use.`
      : `Create custom strategies to categorize your trades — scalping, swing, breakout, or any you use.`,
    feature2Title: isPt ? `Acompanhe Performance` : `Track Performance`,
    feature2Desc: isPt
      ? `Veja qual estrategia tem o melhor win rate, profit factor e retorno — com dados reais dos seus trades.`
      : `See which strategy has the best win rate, profit factor, and return — with real data from your trades.`,
    feature3Title: isPt ? `Compare Resultados` : `Compare Results`,
    feature3Desc: isPt
      ? `Compare estrategias lado a lado e tome decisoes baseadas em dados, nao em intuicao.`
      : `Compare strategies side by side and make decisions based on data, not intuition.`,
    cta: isPt
      ? `Criar Minha Primeira Estrategia`
      : `Create My First Strategy`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque criou uma conta no Trade AI Hub.`
      : `You received this email because you created an account on Trade AI Hub.`,
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
              <!-- Feature 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#6366f1;">&#128221; ${t.feature1Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature1Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Feature 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#a855f7;">&#128202; ${t.feature2Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature2Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Feature 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#22c55e;">&#9878; ${t.feature3Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature3Desc}</p>
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
