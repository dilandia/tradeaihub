interface ConversionC3Params {
  userName?: string
  locale?: string
  creditsUsed: number
  creditsTotal: number
  currentPlan: string
}

export function conversionC3CreditLimitHtml(params: ConversionC3Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const subscriptionUrl = `${appUrl}/settings/subscription`
  const isFree = params.currentPlan.toLowerCase() === "free"
  const percentUsed = params.creditsTotal > 0 ? Math.round((params.creditsUsed / params.creditsTotal) * 100) : 0
  const creditsRemaining = Math.max(0, params.creditsTotal - params.creditsUsed)

  const t = {
    preheader: isPt
      ? `${percentUsed}% dos seus creditos de IA foram usados — recarregue agora`
      : `${percentUsed}% of your AI credits used — top up now`,
    heading: isPt
      ? `Creditos de IA Acabando`
      : `AI Credits Running Low`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Voce ja usou <strong style="color:#f59e0b;">${percentUsed}%</strong> dos seus creditos de IA neste periodo. Restam apenas <strong style="color:#f59e0b;">${creditsRemaining}</strong> creditos.`
      : `You've used <strong style="color:#f59e0b;">${percentUsed}%</strong> of your AI credits this period. Only <strong style="color:#f59e0b;">${creditsRemaining}</strong> credits remaining.`,
    usageLabel: isPt ? `Uso de Creditos` : `Credit Usage`,
    usedLabel: isPt ? `Usados` : `Used`,
    remainingLabel: isPt ? `Restantes` : `Remaining`,
    zeroTitle: isPt
      ? `O que acontece quando os creditos acabam?`
      : `What happens when credits run out?`,
    zero1: isPt
      ? `Os agentes de IA (Insights, Patterns, Risk, Copilot) ficam indisponiveis`
      : `AI agents (Insights, Patterns, Risk, Copilot) become unavailable`,
    zero2: isPt
      ? `Relatorios com resumo de IA param de funcionar`
      : `AI-powered report summaries stop working`,
    zero3: isPt
      ? `Seu dashboard, importacoes e analise manual continuam funcionando normalmente`
      : `Your dashboard, imports, and manual analysis keep working normally`,
    benefitTitle: isPt
      ? isFree
        ? `Beneficios do plano Pro:`
        : `Compre mais creditos:`
      : isFree
        ? `Pro plan benefits:`
        : `Buy more credits:`,
    benefit1: isPt
      ? isFree
        ? `60 creditos de IA por mes (vs 10 no Free)`
        : `Packs de creditos adicionais disponiveis`
      : isFree
        ? `60 AI credits per month (vs 10 on Free)`
        : `Additional credit packs available`,
    benefit2: isPt
      ? isFree
        ? `Exportacao PDF, estrategias ilimitadas, 5 contas`
        : `Creditos nunca expiram enquanto sua assinatura estiver ativa`
      : isFree
        ? `PDF export, unlimited strategies, 5 accounts`
        : `Credits never expire while your subscription is active`,
    benefit3: isPt
      ? isFree
        ? `Todos os 7 agentes de IA sem restricao`
        : `Disponivel imediatamente apos a compra`
      : isFree
        ? `All 7 AI agents without restrictions`
        : `Available immediately after purchase`,
    cta: isPt
      ? isFree
        ? `Fazer Upgrade para Pro`
        : `Comprar Mais Creditos`
      : isFree
        ? `Upgrade to Pro`
        : `Buy More Credits`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque seus creditos de IA estao acabando no Trade AI Hub.`
      : `You received this email because your AI credits are running low on Trade AI Hub.`,
  }

  // Build usage bar visual (inline CSS for email compatibility)
  const barWidth = Math.min(percentUsed, 100)
  const barColor = percentUsed >= 90 ? "#ef4444" : percentUsed >= 80 ? "#f59e0b" : "#22c55e"

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
              <!-- Usage bar card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600;">${t.usageLabel}</p>
                    <!-- Progress bar -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0;">
                          <div style="width:100%;height:12px;background-color:#334155;border-radius:6px;overflow:hidden;">
                            <div style="width:${barWidth}%;height:12px;background-color:${barColor};border-radius:6px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#94a3b8;">${t.usedLabel}: <strong style="color:${barColor};">${params.creditsUsed}/${params.creditsTotal}</strong></p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:13px;color:#94a3b8;">${t.remainingLabel}: <strong style="color:#e2e8f0;">${creditsRemaining}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- What happens at zero -->
              <p style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.zeroTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.zero1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#ef4444;">&#10007; ${t.zero2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.zero3}</p>
                  </td>
                </tr>
              </table>
              <!-- Benefits / upsell -->
              <p style="margin:24px 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.benefitTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.benefit3}</p>
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
