/**
 * Built-in SMTP provider, selected with `runtime.registry.email.provider: "smtp"`.
 *
 * `nodemailer` is loaded lazily so it is only pulled into memory (and traced into the registry
 * bundle) when this provider is selected. Options may come from environment variables, so numbers
 * and booleans can arrive as strings.
 */

import type { EmailProvider } from '../types';

const toNumber = (value: unknown): number | undefined => {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
};

const toBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : typeof value === 'string' && value.trim() ? value.trim() === 'true' : undefined;

/** Build an SMTP provider from options whose references are already resolved. */
export const createSmtpProvider = (options: Record<string, unknown>): EmailProvider => {
  const host = typeof options.host === 'string' ? options.host : '';
  const configuredPort = toNumber(options.port);
  const secure = toBoolean(options.secure) ?? (configuredPort === undefined || configuredPort === 465);
  const port = configuredPort ?? (secure ? 465 : 587);
  const user = typeof options.user === 'string' ? options.user : undefined;
  const password = typeof options.password === 'string' ? options.password : undefined;

  return {
    async send({ from, to, subject, html, text }) {
      if (!host) throw new Error('The SMTP host is not set.');
      const { createTransport } = await import('nodemailer');
      const transport = createTransport({ host, port, secure, auth: user ? { user, pass: password } : undefined });
      const info = await transport.sendMail({ from, to, subject, html, text });
      if (info.rejected?.length) {
        throw new Error(`The SMTP server rejected the recipient: ${info.response}`);
      }
    },
  };
};
