interface OnboardingO4Params {
  userName?: string
  locale?: string
}

export function onboardingO4FirstAiAgentHtml(params: OnboardingO4Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `Conheca seus agentes de IA — eles analisam seus trades 24/7`
      : `Meet your AI agents — they analyze your trades 24/7`,
    heading: isPt
      ? `Seu Coach de Trading com IA`
      : `Your AI Trading Coach`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Voce sabia que tem acesso a agentes de IA especializados em trading? Eles trabalham como seu coach pessoal, analisando cada aspecto dos seus trades.`
      : `Did you know you have access to AI agents specialized in trading? They work as your personal coach, analyzing every aspect of your trades.`,
    agentsTitle: isPt
      ? `Conheca 3 agentes-chave:`
      : `Meet 3 key agents:`,
    agent1Title: isPt ? `Performance Insights` : `Performance Insights`,
    agent1Desc: isPt
      ? `Analisa seu win rate, profit factor e identifica seus melhores e piores periodos de trading.`
      : `Analyzes your win rate, profit factor, and identifies your best and worst trading periods.`,
    agent2Title: isPt ? `Deteccao de Padroes` : `Pattern Detection`,
    agent2Desc: isPt
      ? `Identifica padroes recorrentes de ganho e perda que voce pode nao ter percebido.`
      : `Spots recurring winning and losing patterns you might not have noticed.`,
    agent3Title: isPt ? `Copilot Chat` : `Copilot Chat`,
    agent3Desc: isPt
      ? `Pergunte qualquer coisa sobre seu trading — o copilot conhece todo seu historico.`
      : `Ask anything about your trading — the copilot knows your entire history.`,
    cta: isPt
      ? `Analisar Meu Trading`
      : `Analyze My Trading`,
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
              <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.agentsTitle}</p>
              <!-- Agent 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#6366f1;">&#128200; ${t.agent1Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.agent1Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Agent 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#a855f7;">&#128270; ${t.agent2Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.agent2Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Agent 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:8px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#22c55e;">&#128172; ${t.agent3Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.agent3Desc}</p>
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
