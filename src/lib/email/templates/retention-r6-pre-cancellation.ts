interface RetentionR6Params {
  userName?: string
  locale?: string
}

export function retentionR6PreCancellationHtml(params: RetentionR6Params): string {
  const isPt = params.locale?.startsWith("pt")
  const name = params.userName || "Trader"

  const t = {
    preheader: isPt
      ? `Antes de ir, queremos ajudar. Sua opiniao importa para nos.`
      : `Before you go, we want to help. Your feedback matters to us.`,
    heading: isPt ? `Antes de Ir...` : `Before You Go...`,
    greeting: isPt ? `Oi ${name},` : `Hey ${name},`,
    intro: isPt
      ? `Percebemos que voce visitou a pagina de cancelamento. Antes de tomar uma decisao, queremos que saiba que estamos aqui para ajudar.`
      : `We noticed you visited the cancellation page. Before you make a decision, we want you to know we're here to help.`,
    valueTitle: isPt ? `O que voce tem acesso:` : `What you have access to:`,
    value1: isPt
      ? `Todas as analises de IA e insights dos seus trades`
      : `All AI analysis and insights from your trades`,
    value2: isPt
      ? `Historico completo de performance e evolucao`
      : `Complete performance history and evolution`,
    value3: isPt
      ? `7 agentes de IA para diferentes analises`
      : `7 AI agents for different analysis types`,
    helpTitle: isPt ? `Podemos ajudar:` : `We can help:`,
    help1: isPt
      ? `Se o preco e um problema, podemos encontrar uma solucao`
      : `If pricing is an issue, we can find a solution`,
    help2: isPt
      ? `Se algo nao esta funcionando, queremos corrigir`
      : `If something isn't working, we want to fix it`,
    help3: isPt
      ? `Se voce precisa de uma funcionalidade diferente, conte para nos`
      : `If you need a different feature, let us know`,
    closing: isPt
      ? `Sua opiniao e muito importante para nos. Adorariamos ouvir como podemos melhorar.`
      : `Your feedback is very important to us. We'd love to hear how we can improve.`,
    cta: isPt ? `Fale Conosco` : `Talk to Us`,
    ctaFeedback: isPt ? `Dar Feedback` : `Give Feedback`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque visitou a pagina de cancelamento.`
      : `You received this email because you visited the cancellation page.`,
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
              <!-- Value reminder -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.valueTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.value1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.value2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#22c55e;">&#10003; ${t.value3}</p>
                  </td>
                </tr>
              </table>
              <!-- Help options -->
              <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#e2e8f0;">${t.helpTitle}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:8px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.help1}</p>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.help2}</p>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#a855f7;">&#9733; ${t.help3}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#94a3b8;">${t.closing}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);margin-right:12px;">
                    <a href="mailto:support@tradeaihub.com?subject=${encodeURIComponent(isPt ? "Preciso de ajuda" : "I need help")}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${t.cta}</a>
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
