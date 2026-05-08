interface EmailLayoutInput {
  title: string;
  preheader: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLayout({
  title,
  preheader,
  intro,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  footer,
}: EmailLayoutInput): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(
          ctaUrl
        )}" style="background:#1f6feb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">${escapeHtml(
          ctaLabel
        )}</a></p>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#24292f;">
    <div style="display:none;opacity:0;max-height:0;overflow:hidden;">${escapeHtml(
      preheader
    )}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d0d7de;border-radius:10px;padding:24px;">
            <tr><td>
              <h2 style="margin:0 0 12px;font-size:22px;">${escapeHtml(title)}</h2>
              <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(intro)}</p>
              ${bodyHtml}
              ${cta}
              <p style="margin:28px 0 0;color:#57606a;font-size:12px;line-height:1.4;">
                ${escapeHtml(
                  footer || "If you did not request this email, you can ignore it."
                )}
              </p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function accountCreatedEmailTemplate(
  email: string,
  domain: string,
  link: string
): string {
  return renderLayout({
    title: "Account created",
    preheader: `Your ${domain} account is ready`,
    intro: "Your account has been created and is ready for activation.",
    bodyHtml: `<p style="margin:0;line-height:1.5;">Account: <strong>${escapeHtml(
      email
    )}</strong></p>
<p style="margin:8px 0 0;line-height:1.5;">Domain: <strong>${escapeHtml(
      domain
    )}</strong></p>`,
    ctaLabel: "Activate account",
    ctaUrl: link,
    footer: "Use the button above to activate your account.",
  });
}

export function passwordResetRequestEmailTemplate(
  email: string,
  domain: string,
  link: string
): string {
  return renderLayout({
    title: "Password reset request",
    preheader: `Reset your ${domain} password`,
    intro: "We received a request to reset your password.",
    bodyHtml: `<p style="margin:0;line-height:1.5;">Account: <strong>${escapeHtml(
      email
    )}</strong></p>
<p style="margin:8px 0 0;line-height:1.5;">Domain: <strong>${escapeHtml(
      domain
    )}</strong></p>`,
    ctaLabel: "Reset password",
    ctaUrl: link,
    footer:
      "If you did not request this reset, no action is needed and your password stays unchanged.",
  });
}

export function passwordAdminResetEmailTemplate(
  username: string,
  rawPassword: string,
  domain: string
): string {
  return renderLayout({
    title: "Password reset",
    preheader: `Your ${domain} password was reset`,
    intro: "An administrator reset your password.",
    bodyHtml: `<p style="margin:0;line-height:1.5;">User: <strong>${escapeHtml(
      username
    )}</strong></p>
<p style="margin:8px 0 0;line-height:1.5;">Temporary password: <code>${escapeHtml(
      rawPassword
    )}</code></p>`,
    footer: "Please sign in and change this temporary password immediately.",
  });
}

export function testEmailTemplate(domain: string): string {
  return renderLayout({
    title: "Test mail",
    preheader: `Mailer test from ${domain}`,
    intro: "This is a test email from the configured mailer service.",
    bodyHtml: `<p style="margin:0;line-height:1.5;">Mailer domain: <strong>${escapeHtml(
      domain
    )}</strong></p>`,
    footer: "If you received this message, the email configuration works.",
  });
}
