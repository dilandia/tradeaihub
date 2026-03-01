interface AffiliateApplicationReceivedParams {
  applicantName?: string
  locale?: string
}

export function affiliateApplicationReceivedEmailHtml(params: AffiliateApplicationReceivedParams): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.applicantName || (isPt ? "Candidato" : "Applicant")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com"
  const affiliatesUrl = `${appUrl}/affiliates`

  const t = {
    preheader: isPt
      ? `Recebemos sua candidatura ao programa de afiliados.`
      : `We received your affiliate program application.`,
    heading: isPt
      ? `Candidatura Recebida!`
      : `Application Received!`,
    greeting: isPt
      ? `Oi ${name},`
      : `Hey ${name},`,
    intro: isPt
      ? `Obrigado por se candidatar ao programa de afiliados do Trade AI Hub! Recebemos sua aplicacao e ela esta em analise.`
      : `Thank you for applying to the Trade AI Hub Affiliate Program! We've received your application and it's now under review.`,
    timeline: isPt
      ? `Nossa equipe analisara sua candidatura em ate 48 horas. Voce recebera um email com o resultado assim que tivermos uma decisao.`
      : `Our team will review your application within 48 hours. You'll receive an email with the result once we've made a decision.`,
    whatNext: isPt ? `O que acontece agora:` : `What happens next:`,
    step1: isPt
      ? `Nossa equipe analisa seu perfil e presenca online`
      : `Our team reviews your profile and online presence`,
    step2: isPt
      ? `Voce recebe um email com o resultado (aprovado ou nao)`
      : `You receive an email with the result (approved or not)`,
    step3: isPt
      ? `Se aprovado, voce ganha acesso ao dashboard de afiliado com seu link e codigo unicos`
      : `If approved, you get access to the affiliate dashboard with your unique link and code`,
    ctaText: isPt ? `Ver Programa de Afiliados` : `View Affiliate Program`,
    footer: isPt
      ? `Obrigado pelo seu interesse! Entraremos em contato em breve.`
      : `Thank you for your interest! We'll be in touch soon.`,
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
      <div style="display:inline-block;background:#818cf820;border-radius:50%;padding:16px;margin-bottom:16px">
        <span style="font-size:32px">&#9989;</span>
      </div>
      <h1 style="color:#ffffff;font-size:24px;margin:0">${t.heading}</h1>
    </div>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 16px">${t.intro}</p>
    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px">${t.timeline}</p>
    <div style="background:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#ffffff;font-size:14px;font-weight:600;margin:0 0 12px">${t.whatNext}</p>
      <ol style="color:#a1a1aa;font-size:13px;line-height:1.8;padding-left:20px;margin:0">
        <li>${t.step1}</li>
        <li>${t.step2}</li>
        <li>${t.step3}</li>
      </ol>
    </div>
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
