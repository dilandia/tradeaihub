interface OnboardingO2Params {
  userName?: string
  locale?: string
}

export function onboardingO2ImportGuideHtml(params: OnboardingO2Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`
  const helpUrl = `${appUrl}/help`

  const t = {
    preheader: isPt
      ? `Traders que importam nos primeiros 2 dias descobrem padroes que mudam tudo`
      : `Traders who import in the first 2 days discover game-changing patterns`,
    heading: isPt
      ? `Seu Trading Tem Uma Historia Escondida`
      : `Your Trading Has a Hidden Story`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Cada trade que voce ja fez carrega uma licao. O problema? Sem analise, essas licoes ficam invisiveis. Em menos de 2 minutos, voce pode revelar padroes que nem sabia que existiam.`
      : `Every trade you've ever made carries a lesson. The problem? Without analysis, those lessons stay invisible. In less than 2 minutes, you can reveal patterns you didn't even know existed.`,
    stepsTitle: isPt
      ? `Como Funciona (2 minutos):`
      : `How It Works (2 minutes):`,
    step1Title: isPt ? `Exporte do MT5` : `Export from MT5`,
    step1Desc: isPt
      ? `No MT5: Historico da Conta → Botao direito → Salvar como Relatorio Detalhado`
      : `In MT5: Account History → Right click → Save as Detailed Report`,
    step2Title: isPt ? `Faca o Upload` : `Upload the File`,
    step2Desc: isPt
      ? `Faca upload do arquivo no Trade AI Hub — aceita HTML ou CSV`
      : `Upload the file to Trade AI Hub — accepts HTML or CSV`,
    step3Title: isPt ? `Descoberta!` : `Discovery!`,
    step3Desc: isPt
      ? `A IA analisa automaticamente seus padroes, pontos fortes e oportunidades de melhoria.`
      : `AI automatically analyzes your patterns, strengths and improvement opportunities.`,
    cta: isPt
      ? `Revelar Meus Padroes`
      : `Reveal My Patterns`,
    helpLink: isPt
      ? `Precisa de ajuda com a importacao?`
      : `Need help with importing?`,
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
              <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.stepsTitle}</p>
              <!-- Step 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#7c3aed);text-align:center;line-height:28px;font-size:14px;font-weight:700;color:#ffffff;">1</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#e2e8f0;">${t.step1Title}</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">${t.step1Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Step 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#7c3aed);text-align:center;line-height:28px;font-size:14px;font-weight:700;color:#ffffff;">2</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#e2e8f0;">${t.step2Title}</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">${t.step2Desc}</p>
                  </td>
                </tr>
              </table>
              <!-- Step 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td width="36" valign="top" style="padding-top:2px;">
                    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#7c3aed);text-align:center;line-height:28px;font-size:14px;font-weight:700;color:#ffffff;">3</div>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#e2e8f0;">${t.step3Title}</p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">${t.step3Desc}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 12px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${dashboardUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Secondary link -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="${helpUrl}" target="_blank" style="font-size:13px;color:#6366f1;text-decoration:underline;">${t.helpLink}</a>
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
