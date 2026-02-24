interface ConversionC6Params {
  userName?: string
  locale?: string
}

export function conversionC6ValueRecapHtml(params: ConversionC6Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const pricingUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Veja o que seu plano Free oferece — e o que voce esta perdendo`
      : `See what your Free plan offers — and what you're missing`,
    heading: isPt
      ? `Destaques do Seu Plano Free`
      : `Your Free Plan Highlights`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Ja faz duas semanas que voce se juntou ao Trade AI Hub. Aqui esta um resumo do que seu plano Free oferece — e do que mais voce pode desbloquear.`
      : `It's been two weeks since you joined Trade AI Hub. Here's a recap of what your Free plan offers — and what more you can unlock.`,
    freeTitle: isPt ? `O que voce tem hoje:` : `What you have today:`,
    free1: isPt ? `Dashboard com metricas basicas de trading` : `Dashboard with basic trading metrics`,
    free2: isPt ? `1 conta de trading vinculada` : `1 linked trading account`,
    free3: isPt ? `10 creditos de IA por mes` : `10 AI credits per month`,
    free4: isPt ? `Relatorios semanais por email` : `Weekly email reports`,
    proTitle: isPt ? `O que o Pro desbloqueia:` : `What Pro unlocks:`,
    pro1: isPt ? `7 agentes de IA (Insights, Patterns, Risk, Copilot e mais)` : `7 AI agents (Insights, Patterns, Risk, Copilot, and more)`,
    pro2: isPt ? `Importacoes ilimitadas de trades` : `Unlimited trade imports`,
    pro3: isPt ? `Exportacao PDF dos seus relatorios` : `PDF export of your reports`,
    pro4: isPt ? `Estrategias ilimitadas e tags avancadas` : `Unlimited strategies and advanced tags`,
    pro5: isPt ? `5 contas de trading + 60 creditos de IA/mes` : `5 trading accounts + 60 AI credits/month`,
    cta: isPt ? `Comparar Planos` : `Compare Plans`,
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
              <!-- Free plan card -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.freeTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">&#10003; ${t.free1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">&#10003; ${t.free2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">&#10003; ${t.free3}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">&#10003; ${t.free4}</p>
                  </td>
                </tr>
              </table>
              <!-- Pro plan card -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.proTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:3px solid #a855f7;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.pro1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.pro2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.pro3}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.pro4}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.pro5}</p>
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
                    <a href="${pricingUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
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
