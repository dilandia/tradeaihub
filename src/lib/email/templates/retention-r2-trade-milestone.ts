interface RetentionR2Params {
  userName?: string
  locale?: string
  milestone: number
}

export function retentionR2TradeMilestoneHtml(params: RetentionR2Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard`
  const { milestone } = params

  const badgeEmoji = milestone >= 5000 ? "&#127942;" : milestone >= 1000 ? "&#11088;" : milestone >= 500 ? "&#128293;" : "&#127881;"

  const t = {
    preheader: isPt
      ? `Voce analisou ${milestone} trades! Parabens pela conquista!`
      : `You've analyzed ${milestone} trades! Congrats on the milestone!`,
    heading: isPt ? `Marco Atingido!` : `Milestone Reached!`,
    greeting: isPt ? `Parabens, ${name}!` : `Congratulations, ${name}!`,
    milestone: isPt
      ? `Voce analisou`
      : `You've analyzed`,
    milestoneTradesWord: isPt ? `trades` : `trades`,
    journey: isPt
      ? milestone >= 5000
        ? `Voce e um verdadeiro mestre da analise. Poucos traders chegam tao longe. Seu comprometimento com dados esta no mais alto nivel.`
        : milestone >= 1000
          ? `Mil trades analisados! Voce esta no caminho dos traders de elite. Cada trade e um aprendizado e voce ja tem muitos.`
          : milestone >= 500
            ? `Meio caminho andado para o proximo grande marco! Sua consistencia na analise esta fazendo a diferenca.`
            : `Seus primeiros 100 trades analisados! O habito de analisar cada trade e o que separa traders amadores dos profissionais.`
      : milestone >= 5000
        ? `You're a true analysis master. Few traders come this far. Your data commitment is at the highest level.`
        : milestone >= 1000
          ? `One thousand trades analyzed! You're on the path of elite traders. Every trade is a lesson and you've got plenty.`
          : milestone >= 500
            ? `Halfway to the next big milestone! Your consistency in analysis is making a real difference.`
            : `Your first 100 trades analyzed! The habit of reviewing every trade is what separates amateurs from pros.`,
    cta: isPt ? `Ver Meu Progresso` : `View My Progress`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque atingiu um marco no Trade AI Hub.`
      : `You received this email because you reached a milestone on Trade AI Hub.`,
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
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Trade AI Hub</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">${t.heading}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <p style="margin:0 0 24px;font-size:18px;font-weight:600;color:#e2e8f0;">${t.greeting}</p>
              <!-- Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;border:1px solid #f59e0b33;">
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:48px;line-height:1;">${badgeEmoji}</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${t.milestone}</p>
                    <p style="margin:0;font-size:48px;font-weight:800;color:#f59e0b;letter-spacing:-1px;">${milestone.toLocaleString()}</p>
                    <p style="margin:4px 0 0;font-size:16px;color:#e2e8f0;text-transform:uppercase;letter-spacing:2px;">${t.milestoneTradesWord}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#94a3b8;text-align:left;">${t.journey}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#f59e0b,#f97316);">
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
