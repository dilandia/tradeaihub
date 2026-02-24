interface ConversionC8Params {
  userName?: string
  locale?: string
  discountPercent?: number
}

export function conversionC8SpecialOfferHtml(params: ConversionC8Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const discount = params.discountPercent || 20
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Oferta por tempo limitado — ${discount}% de desconto no plano Pro`
      : `Limited-time offer — ${discount}% off the Pro plan`,
    heading: isPt
      ? `Oferta Especial — ${discount}% Off Pro`
      : `Special Offer — ${discount}% Off Pro`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Voce esta no Trade AI Hub ha um mes — e queremos recompensar seu comprometimento. Por tempo limitado, estamos oferecendo <strong style="color:#f59e0b;">${discount}% de desconto</strong> no primeiro mes do plano Pro.`
      : `You've been on Trade AI Hub for a month — and we want to reward your commitment. For a limited time, we're offering <strong style="color:#f59e0b;">${discount}% off</strong> your first month of the Pro plan.`,
    urgency: isPt
      ? `Esta oferta expira em 7 dias`
      : `This offer expires in 7 days`,
    benefitTitle: isPt ? `Tudo que voce desbloqueia com o Pro:` : `Everything you unlock with Pro:`,
    benefit1: isPt ? `60 creditos de IA por mes (6x mais que o Free)` : `60 AI credits per month (6x more than Free)`,
    benefit2: isPt ? `7 agentes de IA: Insights, Patterns, Risk, Copilot e mais` : `7 AI agents: Insights, Patterns, Risk, Copilot, and more`,
    benefit3: isPt ? `Importacoes ilimitadas de trades` : `Unlimited trade imports`,
    benefit4: isPt ? `Exportacao PDF dos seus relatorios` : `PDF export of your reports`,
    benefit5: isPt ? `Estrategias e tags ilimitadas` : `Unlimited strategies and tags`,
    benefit6: isPt ? `5 contas de trading simultaneas` : `5 simultaneous trading accounts`,
    cta: isPt ? `Fazer Upgrade Agora — ${discount}% Off` : `Upgrade Now — ${discount}% Off`,
    noWorries: isPt
      ? `Sem compromisso de longo prazo. Cancele a qualquer momento.`
      : `No long-term commitment. Cancel anytime.`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque esta no plano Free do Trade AI Hub.`
      : `You received this email because you're on the Free plan of Trade AI Hub.`,
  }

  // Countdown visual: 7 boxes representing days
  const dayBoxes = Array.from({ length: 7 }, (_, i) => {
    const dayLabel = i + 1
    return `<td style="width:14%;text-align:center;padding:8px 4px;">
      <div style="background-color:#1e293b;border-radius:6px;padding:12px 0;">
        <span style="font-size:20px;font-weight:700;color:#f59e0b;display:block;">${dayLabel}</span>
        <span style="font-size:10px;color:#64748b;text-transform:uppercase;">${isPt ? "dia" : "day"}</span>
      </div>
    </td>`
  }).join("")

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
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 50%,#b45309 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Trade AI Hub</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:400;">${t.heading}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e2e8f0;">${t.greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">${t.intro}</p>
              <!-- Countdown -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="text-align:center;padding-bottom:8px;">
                    <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#f59e0b;font-weight:600;">${t.urgency}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  ${dayBoxes}
                </tr>
              </table>
              <!-- Benefits -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.benefitTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;border-left:3px solid #f59e0b;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit3}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit4}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit5}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit6}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 16px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#f59e0b,#d97706);">
                    <a href="${subscriptionUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:13px;color:#64748b;">${t.noWorries}</p>
            </td>
          </tr>
          <!-- Divider -->
          <tr><td style="padding:16px 40px 0;"><div style="height:1px;background-color:#1e293b;"></div></td></tr>
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
