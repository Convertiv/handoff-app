/**
 * Built-in Resend provider, selected with `runtime.registry.email.provider: "resend"` (the default).
 * A plain `fetch` to the Resend HTTP API, so it adds no dependency.
 */

import type { EmailProvider } from '../types';

/** Build a Resend provider from options whose references are already resolved. */
export const createResendProvider = (options: Record<string, unknown>): EmailProvider => ({
  async send({ from, to, subject, html, text }) {
    const apiKey = typeof options.apiKey === 'string' ? options.apiKey : '';
    if (!apiKey) throw new Error('The Resend API key is not set.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
    });
    if (!response.ok) {
      throw new Error(`Resend rejected the email (HTTP ${response.status}): ${await response.text()}`);
    }
  },
});
