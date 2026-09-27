import { getServerRuntimeConfig } from '../docs-api/runtime-config';

const emailSettings = (): { from: string; apiKey: string } | null => {
  const { from, apiKeyEnv } = getServerRuntimeConfig().email;
  const apiKey = process.env[apiKeyEnv]?.trim();
  return from && apiKey ? { from, apiKey } : null;
};

export const registryEmailIsConfigured = (): boolean => emailSettings() !== null;

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

const FOOTNOTE = 'If you did not expect this email, you can ignore it.';

interface AuthEmail {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}

const renderHtml = ({ heading, message, actionLabel, actionUrl }: AuthEmail): string => {
  const url = escapeHtml(actionUrl);
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:32px 16px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;">
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.5;">${escapeHtml(message)}</p>
<a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:6px;background:#18181b;color:#ffffff;font-size:15px;text-decoration:none;">${escapeHtml(actionLabel)}</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#71717a;">If the button does not work, open this link:<br><a href="${url}" style="color:#71717a;word-break:break-all;">${url}</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">${FOOTNOTE}</p>
</td></tr></table>
</td></tr></table>
</body>
</html>`;
};

const renderText = ({ heading, message, actionLabel, actionUrl }: AuthEmail): string =>
  `${heading}\n\n${message}\n\n${actionLabel}: ${actionUrl}\n\n${FOOTNOTE}\n`;

/** Send through Resend. Returns false when email is not configured or delivery fails; failures are logged. */
export const sendRegistryAuthEmail = async (email: AuthEmail): Promise<boolean> => {
  const settings = emailSettings();
  if (!settings) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: settings.from,
        to: [email.to],
        subject: email.subject,
        html: renderHtml(email),
        text: renderText(email),
      }),
    });
    if (response.ok) return true;
    console.error(`Resend rejected the email (HTTP ${response.status}).`, await response.text());
  } catch (error) {
    console.error('Resend request failed.', error);
  }
  return false;
};
