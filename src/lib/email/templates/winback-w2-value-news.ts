interface WinbackW2Params {
  userName?: string
  locale?: string
}

export function winbackW2ValueNewsHtml(params: WinbackW2Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `3 semanas longe. Seus trades desse periodo tem historias para contar`
      : `3 weeks away. Your trades from this period have stories to tell`,
    heading: isPt ? `Muita Coisa Mudou` : `A Lot Has Changed`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `${name}, nas ultimas 3 semanas, lancamos melhorias que voce vai querer experimentar. O dashboard esta mais rapido, os insights mais precisos, e adicionamos novas formas de visualizar seus dados.`
      : `${name}, in the last 3 weeks, we launched improvements you'll want to try. The dashboard is faster, insights more precise, and we added new ways to visualize your data.`,
    feature1Title: isPt ? `Performance ate 3x mais rapida no dashboard` : `Up to 3x faster dashboard performance`,
    feature1Desc: isPt
      ? `Navegacao fluida, carregamento instantaneo. A experiencia mudou completamente.`
      : `Smooth navigation, instant loading. The experience has completely changed.`,
    feature2Title: isPt ? `Insights de IA com recomendacoes mais especificas` : `AI insights with more specific recommendations`,
    feature2Desc: isPt
      ? `Os agentes agora identificam padroes que antes passavam despercebidos.`
      : `Agents now identify patterns that previously went unnoticed.`,
    feature3Title: isPt ? `Nova visualizacao de equity curve e drawdown` : `New equity curve and drawdown visualization`,
    feature3Desc: isPt
      ? `Acompanhe a evolucao do seu capital com graficos mais detalhados.`
      : `Track your capital evolution with more detailed charts.`,
    tipTitle: isPt ? `Dica de Trading` : `Trading Tip`,
    tip: isPt
      ? `Seus dados de trading continuam salvos e prontos para analise. Quanto antes voce voltar, mais cedo descobre padroes que podem fazer diferenca no proximo mes.`
      : `Your trading data is still saved and ready for analysis. The sooner you come back, the sooner you discover patterns that could make a difference next month.`,
    cta: isPt ? `Ver As Novidades` : `See What's New`,
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
              <!-- Feature 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#e2e8f0;">&#9889; ${t.feature1Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature1Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Feature 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:12px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#e2e8f0;">&#129302; ${t.feature2Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature2Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Feature 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#e2e8f0;">&#127991; ${t.feature3Title}</p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#94a3b8;">${t.feature3Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Trading tip -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:4px solid #f59e0b;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${t.tipTitle}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;font-style:italic;">${t.tip}</p>
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
