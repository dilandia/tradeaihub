interface WinbackW3Params {
  userName?: string
  locale?: string
}

export function winbackW3LastAttemptHtml(params: WinbackW3Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const t = {
    preheader: isPt
      ? `Ultimo aviso: seus dados e insights serao arquivados em breve`
      : `Final notice: your data and insights will be archived soon`,
    heading: isPt ? `Uma Ultima Mensagem` : `One Last Message`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `${name}, essa e a ultima vez que te escrevemos sobre isso. Voce esta pagando pelo plano Pro mas nao esta usando — e queremos ter certeza de que isso e intencional.`
      : `${name}, this is the last time we'll write about this. You're paying for the Pro plan but not using it — and we want to make sure this is intentional.`,
    safe1: isPt
      ? `Seus dados estao 100% seguros e protegidos`
      : `Your data is 100% safe and secure`,
    safe2: isPt
      ? `Todo o seu historico de trades e analises continua disponivel`
      : `All your trade history and analysis remains available`,
    safe3: isPt
      ? `Voce pode voltar a qualquer momento`
      : `You can come back anytime`,
    body: isPt
      ? `Preferimos ser honestos: nao queremos cobrar de voce se voce nao esta usando. Mas se precisar de ajuda para aproveitar melhor a plataforma, estamos aqui.`
      : `We'd rather be honest: we don't want to charge you if you're not using it. But if you need help getting more from the platform, we're here.`,
    closing: isPt
      ? `Se voce esta ocupado demais para usar agora, tudo bem. Mas se nao esta tirando valor da plataforma, talvez faca sentido pausar a assinatura e voltar quando tiver tempo.`
      : `If you're too busy to use it now, that's fine. But if you're not getting value from the platform, it might make sense to pause your subscription and come back when you have time.`,
    cta: isPt ? `Voltar a Usar` : `Start Using Again`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Esta e a ultima mensagem deste tipo que voce recebera.`
      : `This is the last message of this kind you'll receive.`,
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
              <!-- Data safety -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#128274; ${t.safe1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#128202; ${t.safe2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#22c55e;">&#128075; ${t.safe3}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.body}</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#94a3b8;font-style:italic;">${t.closing}</p>
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
