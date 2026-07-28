export const registryEmailIsConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.AUTH_FROM_EMAIL?.trim());

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export const sendRegistryAuthEmail = async (input: {
  to: string;
  subject: string;
  heading: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_FROM_EMAIL?.trim();
  if (!apiKey || !from) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html:
        `<h1>${escapeHtml(input.heading)}</h1><p>${escapeHtml(input.message)}</p>` +
        `<p><a href="${escapeHtml(input.actionUrl)}">${escapeHtml(input.actionLabel)}</a></p>`,
    }),
  });
  return response.ok;
};
