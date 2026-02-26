interface AffiliateApprovedParams {
  affiliateName?: string
  affiliateCode: string
  commissionRate: number
  locale?: string
}

export function affiliateApprovedEmailHtml(params: AffiliateApprovedParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.affiliateName || "Partner"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const dashboardUrl = `${appUrl}/dashboard/affiliates`
  const affiliateLink = `${appUrl}/?aff=${params.affiliateCode}`
  const rate = Math.round(params.commissionRate * 100)

  const t = {
    preheader: isPt
      ? `Parabens! Voce foi aprovado como parceiro afiliado do Trade AI Hub.`
      : `Congratulations! You've been approved as a Trade AI Hub affiliate partner.`,
    heading: isPt
      ? `Voce foi aprovado!`
      : `You're Approved!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Otimas noticias! Sua aplicacao ao programa de afiliados do Trade AI Hub foi aprovada. Voce agora e um parceiro oficial.`
      : `Great news! Your application to the Trade AI Hub Affiliate Program has been approved. You're now an official partner.`,
    detailsTitle: isPt ? `Seus dados de afiliado:` : `Your affiliate details:`,
    codeLabel: isPt ? `Seu codigo` : `Your code`,
    linkLabel: isPt ? `Seu link` : `Your link`,
    rateLabel: isPt ? `Comissao` : `Commission rate`,
    rateValue: isPt
      ? `${rate}% recorrente em cada pagamento`
      : `${rate}% recurring on every payment`,
    nextSteps: isPt ? `Proximos passos:` : `Next steps:`,
    step1: isPt
      ? `Acesse seu dashboard de afiliado para ver suas estatisticas`
      : `Visit your affiliate dashboard to see your stats`,
    step2: isPt
      ? `Configure sua carteira crypto para receber pagamentos`
      : `Set up your crypto wallet to receive payments`,
    step3: isPt
      ? `Compartilhe seu link com sua audiencia e comece a ganhar`
      : `Share your link with your audience and start earning`,
    ctaText: isPt ? `Acessar Dashboard` : `Go to Dashboard`,
    footer: isPt
      ? `Estamos animados para ter voce no time! Qualquer duvida, responda este email.`
      : `We're excited to have you on the team! Any questions, just reply to this email.`,
  }

  return `<!DOCTYPE html>
<html lang="${isPt ? "pt-BR" : "en"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="font-size:24px;font-weight:700;color:#ffffff">Trade AI Hub</span>
  </div>
  <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:16px;padding:40px 32px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:#22c55e20;border-radius:50%;padding:16px;margin-bottom:16px">
        <span style="font-size:32px">&#127881;</span>
      </div>
      <h1 style="color:#ffffff;font-size:28px;margin:0 0 8px">${t.heading}</h1>
    </div>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px">${t.intro}</p>
    <div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 12px">${t.detailsTitle}</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px"><strong style="color:#818cf8">${t.codeLabel}:</strong> <code style="background:#2a2a3e;padding:2px 8px;border-radius:4px;color:#ffffff">${params.affiliateCode}</code></p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px;word-break:break-all"><strong style="color:#818cf8">${t.linkLabel}:</strong> <a href="${affiliateLink}" style="color:#818cf8">${affiliateLink}</a></p>
      <p style="color:#a1a1aa;font-size:13px;margin:0"><strong style="color:#818cf8">${t.rateLabel}:</strong> ${t.rateValue}</p>
    </div>
    <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 12px">${t.nextSteps}</p>
    <ul style="color:#a1a1aa;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px">
      <li>${t.step1}</li>
      <li>${t.step2}</li>
      <li>${t.step3}</li>
    </ul>
    <div style="text-align:center;margin:32px 0 16px">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600">${t.ctaText}</a>
    </div>
    <p style="color:#71717a;font-size:13px;text-align:center;margin:24px 0 0">${t.footer}</p>
  </div>
  <p style="color:#52525b;font-size:12px;text-align:center;margin-top:24px">&copy; ${new Date().getFullYear()} Trade AI Hub</p>
</div>
</body>
</html>`
}
