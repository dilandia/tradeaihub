interface RetentionR7Params {
  userName?: string
  locale?: string
  accessEndDate: string
  planName: string
}

export function retentionR7PostCancellationHtml(params: RetentionR7Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`

  const t = {
    preheader: isPt
      ? `Sua assinatura ${params.planName} foi cancelada — mas voce ainda tem acesso`
      : `Your ${params.planName} subscription has been cancelled — but you still have access`,
    heading: isPt
      ? `Sentimos Sua Falta`
      : `We're Sorry to See You Go`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Confirmamos o cancelamento da sua assinatura <strong style="color:#e2e8f0;">${params.planName}</strong>. Voce ainda pode usar todos os recursos do plano ate <strong style="color:#f59e0b;">${params.accessEndDate}</strong>.`
      : `We've confirmed the cancellation of your <strong style="color:#e2e8f0;">${params.planName}</strong> subscription. You can still use all plan features until <strong style="color:#f59e0b;">${params.accessEndDate}</strong>.`,
    loseTitle: isPt ? `O que voce perde apos essa data:` : `What you'll lose after that date:`,
    lose1: isPt ? `Agentes de IA (Insights, Patterns, Risk, Copilot)` : `AI agents (Insights, Patterns, Risk, Copilot)`,
    lose2: isPt ? `Exportacao PDF e relatorios avancados` : `PDF export and advanced reports`,
    lose3: isPt ? `Estrategias ilimitadas e multiplas contas` : `Unlimited strategies and multiple accounts`,
    lose4: isPt ? `60 creditos de IA por mes` : `60 AI credits per month`,
    keepTitle: isPt ? `O que voce mantem (plano Free):` : `What you keep (Free plan):`,
    keep1: isPt ? `Dashboard com metricas basicas` : `Dashboard with basic metrics`,
    keep2: isPt ? `1 conta de trading` : `1 trading account`,
    keep3: isPt ? `10 creditos de IA por mes` : `10 AI credits per month`,
    surveyTitle: isPt
      ? `Nos ajude a melhorar`
      : `Help us improve`,
    surveyText: isPt
      ? `Gostariam de entender por que voce decidiu cancelar. Sua resposta nos ajuda a construir um produto melhor para todos os traders.`
      : `We'd love to understand why you decided to cancel. Your feedback helps us build a better product for all traders.`,
    surveyQ1: isPt ? `O preco nao cabia no meu orcamento` : `The price didn't fit my budget`,
    surveyQ2: isPt ? `Nao estava usando os recursos suficientemente` : `I wasn't using the features enough`,
    surveyQ3: isPt ? `Encontrei uma alternativa melhor` : `I found a better alternative`,
    changeMind: isPt
      ? `Mudou de ideia? Voce pode reativar seu plano a qualquer momento.`
      : `Changed your mind? You can reactivate your plan anytime.`,
    cta: isPt ? `Reativar Meu Plano` : `Reactivate My Plan`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque cancelou sua assinatura no Trade AI Hub.`
      : `You received this email because you cancelled your subscription on Trade AI Hub.`,
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
              <!-- What you lose -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.loseTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.lose1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.lose2}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.lose3}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.lose4}</p>
                  </td>
                </tr>
              </table>
              <!-- What you keep -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.keepTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.keep1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.keep2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.keep3}</p>
                  </td>
                </tr>
              </table>
              <!-- Exit survey -->
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.surveyTitle}</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;">${t.surveyText}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">1. ${t.surveyQ1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#94a3b8;">2. ${t.surveyQ2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">3. ${t.surveyQ3}</p>
                  </td>
                </tr>
              </table>
              <!-- Change mind -->
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;text-align:center;">${t.changeMind}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${subscriptionUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
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
