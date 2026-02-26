interface AffiliateRejectedParams {
  applicantName?: string
  reason?: string
  locale?: string
}

export function affiliateRejectedEmailHtml(params: AffiliateRejectedParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.applicantName || "Applicant"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const affiliatesUrl = `${appUrl}/affiliates`

  const t = {
    preheader: isPt
      ? `Atualizacao sobre sua aplicacao ao programa de afiliados.`
      : `Update on your affiliate program application.`,
    heading: isPt
      ? `Atualizacao da Aplicacao`
      : `Application Update`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Obrigado pelo interesse no programa de afiliados do Trade AI Hub. Apos revisar sua aplicacao, decidimos nao prosseguir neste momento.`
      : `Thank you for your interest in the Trade AI Hub Affiliate Program. After reviewing your application, we've decided not to move forward at this time.`,
    reasonLabel: isPt ? `Motivo:` : `Reason:`,
    noReasonDefault: isPt
      ? `Sua aplicacao nao atendeu aos criterios atuais do programa.`
      : `Your application did not meet the current program criteria.`,
    encouragement: isPt
      ? `Isso nao significa que voce nao possa se inscrever novamente no futuro. Continuamos expandindo nosso programa e encorajamos voce a se candidatar novamente quando tiver uma audiencia maior ou mais experiencia no nicho de trading.`
      : `This doesn't mean you can't apply again in the future. We're continuously expanding our program and encourage you to reapply when you have a larger audience or more experience in the trading niche.`,
    ctaText: isPt ? `Ver Programa de Afiliados` : `View Affiliate Program`,
    footer: isPt
      ? `Obrigado pelo seu interesse. Boa sorte com seus projetos!`
      : `Thank you for your interest. Good luck with your projects!`,
  }

  const reasonHtml = params.reason
    ? `<div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:16px;margin:16px 0">
        <p style="color:#ffffff;font-size:13px;font-weight:600;margin:0 0 4px">${t.reasonLabel}</p>
        <p style="color:#a1a1aa;font-size:13px;margin:0">${params.reason}</p>
      </div>`
    : ""

  return `<!DOCTYPE html>
<html lang="${isPt ? "pt-BR" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-size:24px;font-weight:700;color:#ffffff">Trade AI Hub</span>
  </div>
  <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:16px;padding:40px 32px">
    <h1 style="color:#ffffff;font-size:24px;margin:0 0 24px;text-align:center">${t.heading}</h1>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px">${t.intro}</p>
    ${reasonHtml}
    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:16px 0 24px">${t.encouragement}</p>
    <div style="text-align:center;margin:24px 0 16px">
      <a href="${affiliatesUrl}" style="display:inline-block;background:#1e1e2e;border:1px solid #2a2a3e;color:#a1a1aa;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500">${t.ctaText}</a>
    </div>
    <p style="color:#71717a;font-size:13px;text-align:center;margin:24px 0 0">${t.footer}</p>
  </div>
  <p style="color:#52525b;font-size:12px;text-align:center;margin-top:24px">&copy; ${new Date().getFullYear()} Trade AI Hub</p>
</div>
</body>
</html>`
}
