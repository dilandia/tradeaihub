interface UpgradeConfirmedParams {
  userName?: string
  locale?: string
  planName: string
  nextBillingDate: string
}

export function upgradeConfirmedEmailHtml(params: UpgradeConfirmedParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`

  const isPro = params.planName.toLowerCase().includes("pro")
  const isElite = params.planName.toLowerCase().includes("elite")

  const features = isPro
    ? isPt
      ? [
          "5 contas de trading (antes: 1)",
          "60 creditos de IA por mes",
          "Exportacao PDF dos relatorios",
          "Todas as analises de IA avancadas",
        ]
      : [
          "5 trading accounts (was: 1)",
          "60 AI credits per month",
          "PDF report exports",
          "All advanced AI analyses",
        ]
    : isElite
      ? isPt
          ? [
              "Contas de trading ilimitadas",
              "150 creditos de IA por mes",
              "Exportacao PDF dos relatorios",
              "Todas as analises de IA avancadas",
              "Suporte prioritario",
            ]
          : [
              "Unlimited trading accounts",
              "150 AI credits per month",
              "PDF report exports",
              "All advanced AI analyses",
              "Priority support",
            ]
      : []

  const t = {
    preheader: isPt
      ? `Parabens! Seu plano ${params.planName} esta ativo`
      : `Congrats! Your ${params.planName} plan is now active`,
    heading: isPt
      ? `Upgrade Confirmado!`
      : `Upgrade Confirmed!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Seu upgrade para o plano ${params.planName} foi ativado com sucesso! Aqui esta o que voce desbloqueou:`
      : `Your upgrade to the ${params.planName} plan has been activated! Here's what you've unlocked:`,
    featuresTitle: isPt
      ? `O que esta incluso:`
      : `What's included:`,
    nextBilling: isPt
      ? `Proxima cobranca: ${params.nextBillingDate}`
      : `Next billing: ${params.nextBillingDate}`,
    cta: isPt
      ? `Explorar Novas Features`
      : `Explore New Features`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque fez upgrade no Trade AI Hub.`
      : `You received this email because you upgraded on Trade AI Hub.`,
  }

  const featuresHtml = features
    .map(
      (f) => `<tr>
        <td style="padding:6px 0;font-size:14px;line-height:1.5;color:#94a3b8;">
          <span style="color:#22c55e;margin-right:8px;">&#10003;</span> ${f}
        </td>
      </tr>`
    )
    .join("")

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
              <!-- Features -->
              <div style="background-color:#1e293b;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#e2e8f0;">${t.featuresTitle}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${featuresHtml}
                </table>
              </div>
              <p style="margin:0;font-size:13px;color:#64748b;">${t.nextBilling}</p>
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
