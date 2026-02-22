interface PasswordResetEmailParams {
  resetLink: string
  locale?: string
}

export function passwordResetEmailHtml(params: PasswordResetEmailParams): string {
  const isPt = params.locale?.startsWith("pt")
  const { resetLink } = params

  const t = {
    preheader: isPt
      ? `Redefinir sua senha — Trade AI Hub`
      : `Reset your password — Trade AI Hub`,
    heading: isPt
      ? `Redefinir Senha`
      : `Reset Password`,
    intro: isPt
      ? `Recebemos uma solicitacao para redefinir a senha da sua conta no Trade AI Hub.`
      : `We received a request to reset the password for your Trade AI Hub account.`,
    instruction: isPt
      ? `Clique no botao abaixo para criar uma nova senha. Este link expira em 1 hora.`
      : `Click the button below to create a new password. This link expires in 1 hour.`,
    cta: isPt
      ? `Redefinir Senha`
      : `Reset Password`,
    ignore: isPt
      ? `Se voce nao solicitou a redefinicao de senha, ignore este email. Sua senha nao sera alterada.`
      : `If you didn't request a password reset, please ignore this email. Your password will not be changed.`,
    linkFallback: isPt
      ? `Se o botao nao funcionar, copie e cole este link no navegador:`
      : `If the button doesn't work, copy and paste this link into your browser:`,
    footer: isPt
      ? `Trade AI Hub — Diario de Trading com IA`
      : `Trade AI Hub — AI-Powered Trading Journal`,
    footerSub: isPt
      ? `Voce recebeu este email porque solicitou a redefinicao de senha no Trade AI Hub.`
      : `You received this email because you requested a password reset on Trade AI Hub.`,
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
  <!-- Preheader text (hidden) -->
  <div style="display:none;font-size:1px;color:#0a0a0a;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${t.preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#121212;border-radius:12px;overflow:hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 50%,#a855f7 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Trade AI Hub
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:400;">
                ${t.heading}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">
                ${t.intro}
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                ${t.instruction}
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(to right,#6366f1,#7c3aed);">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      ${t.cta}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Warning -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background-color:#1e293b;border-radius:8px;padding:16px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
                  ${t.ignore}
                </p>
              </div>
            </td>
          </tr>
          <!-- Link fallback -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;">
                ${t.linkFallback}
              </p>
              <p style="margin:0;font-size:12px;color:#6366f1;word-break:break-all;">
                <a href="${resetLink}" style="color:#6366f1;text-decoration:underline;">${resetLink}</a>
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#1e293b;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748b;">
                ${t.footer}
              </p>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">
                ${t.footerSub}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
