interface WinbackW1Params {
  userName?: string
  locale?: string
}

export function winbackW1FriendlyCheckinHtml(params: WinbackW1Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `Sentimos sua falta! Seus trades estao esperando por voce.`
      : `We miss you! Your trades are waiting for you.`,
    heading: isPt ? `Sentimos Sua Falta` : `We Miss You`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `Faz um tempo que voce nao aparece por aqui e queriamos saber se esta tudo bem.`
      : `It's been a while since your last visit and we wanted to check in.`,
    body: isPt
      ? `Seus trades estao esperando para serem analisados. A cada dia que passa, mais dados voce pode importar e melhores insights a IA pode gerar.`
      : `Your trades are waiting to be analyzed. With each passing day, more data you can import and better insights the AI can generate.`,
    socialProof: isPt
      ? `Traders ativos na plataforma analisam em media 50+ trades por semana e reportam melhorias consistentes na tomada de decisao.`
      : `Active traders on the platform analyze 50+ trades per week on average and report consistent improvements in decision-making.`,
    cta: isPt ? `Voltar e Analisar` : `Come Back and Analyze`,
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
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.intro}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.body}</p>
              <!-- Social proof -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:4px solid #a855f7;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;font-style:italic;">${t.socialProof}</p>
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
