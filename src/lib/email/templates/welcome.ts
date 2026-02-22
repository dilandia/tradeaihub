interface WelcomeEmailParams {
  userName?: string
  locale?: string
}

export function welcomeEmailHtml(params: WelcomeEmailParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `Bem-vindo ao Trade AI Hub, ${name}!`
      : `Welcome to Trade AI Hub, ${name}!`,
    heading: isPt
      ? `Bem-vindo ao Trade AI Hub!`
      : `Welcome to Trade AI Hub!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Sua conta foi criada com sucesso. Estamos felizes em ter voce aqui. O Trade AI Hub vai te ajudar a analisar seus trades com inteligencia artificial.`
      : `Your account has been created successfully. We're glad to have you here. Trade AI Hub will help you analyze your trades with artificial intelligence.`,
    stepsTitle: isPt
      ? `Primeiros passos:`
      : `Getting started:`,
    step1: isPt
      ? `Importe seus trades (CSV ou conecte sua conta MT4/MT5)`
      : `Import your trades (CSV or connect your MT4/MT5 account)`,
    step2: isPt
      ? `Explore o Dashboard com metricas em tempo real`
      : `Explore the Dashboard with real-time metrics`,
    step3: isPt
      ? `Use o AI Hub para insights inteligentes sobre seu desempenho`
      : `Use the AI Hub for smart insights about your performance`,
    step4: isPt
      ? `Configure alertas e acompanhe sua evolucao`
      : `Set up alerts and track your progress`,
    cta: isPt
      ? `Ir para o Dashboard`
      : `Go to Dashboard`,
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
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${t.preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121212;border-radius:12px;overflow:hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 50%,#a855f7 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Trade AI Hub
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">
                ${t.heading}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e2e8f0;">
                ${t.greeting}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                ${t.intro}
              </p>
              <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#e2e8f0;">
                ${t.stepsTitle}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:14px;line-height:1.5;color:#94a3b8;">
                    <span style="color:#6366f1;font-weight:700;margin-right:8px;">1.</span> ${t.step1}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;line-height:1.5;color:#94a3b8;">
                    <span style="color:#6366f1;font-weight:700;margin-right:8px;">2.</span> ${t.step2}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;line-height:1.5;color:#94a3b8;">
                    <span style="color:#6366f1;font-weight:700;margin-right:8px;">3.</span> ${t.step3}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;line-height:1.5;color:#94a3b8;">
                    <span style="color:#6366f1;font-weight:700;margin-right:8px;">4.</span> ${t.step4}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e293b;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;">
                ${t.footer}
              </p>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">
                ${t.footerSub}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
