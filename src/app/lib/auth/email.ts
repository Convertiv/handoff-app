import { isEnvReference, resolveEnvReferences } from '@handoff/config/from-env';
import { createResendProvider } from '@handoff/registry/email/adapters/resend';
import { createSmtpProvider } from '@handoff/registry/email/adapters/smtp';
import type { EmailProviderKind, EmailSettings } from '@handoff/registry/email/resolve';
import type { EmailProvider } from '@handoff/registry/email/types';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { loadServerModule } from '../server-module';

/** Options a provider needs before email counts as configured. */
const REQUIRED_OPTIONS: Record<EmailProviderKind, readonly string[]> = { resend: ['apiKey'], smtp: ['host'], custom: [] };

/**
 * The settings that still need a value, named as the administrator sets them: the config key, or the
 * env var that an option references.
 */
export const missingRegistryEmailSettings = (): string[] => {
  const settings = getServerRuntimeConfig().email;
  const options = resolveEnvReferences(settings.options, process.env);
  const missing = settings.from ? [] : ['runtime.registry.email.from'];
  if (settings.provider === 'custom' && !settings.module) missing.push('runtime.registry.email.module');
  for (const key of REQUIRED_OPTIONS[settings.provider]) {
    if (options[key] !== undefined) continue;
    const authored = settings.options[key];
    missing.push(isEnvReference(authored) ? authored.$env : `runtime.registry.email.options.${key}`);
  }
  return missing;
};

export const registryEmailIsConfigured = (): boolean => missingRegistryEmailSettings().length === 0;

/** The provider name for messages shown to an administrator. */
export const registryEmailProviderName = (): string => {
  const { provider } = getServerRuntimeConfig().email;
  return provider === 'resend' ? 'Resend' : provider === 'smtp' ? 'SMTP' : 'the custom email provider';
};

let customProvider: Promise<EmailProvider> | null = null;

/** Load the custom module once and coerce its default export (provider object or factory) to a provider. */
const loadCustomProvider = async (settings: EmailSettings, options: Record<string, unknown>): Promise<EmailProvider> => {
  const provider = await loadServerModule(settings.module!, { options });
  if (typeof (provider as Partial<EmailProvider> | null)?.send !== 'function') {
    throw new Error(`Custom email provider module "${settings.module}" must default-export a defineEmailProvider() provider.`);
  }
  return provider as EmailProvider;
};

const getEmailProvider = (settings: EmailSettings, options: Record<string, unknown>): Promise<EmailProvider> => {
  if (settings.provider === 'resend') return Promise.resolve(createResendProvider(options));
  if (settings.provider === 'smtp') return Promise.resolve(createSmtpProvider(options));
  customProvider ??= loadCustomProvider(settings, options).catch((error) => {
    customProvider = null;
    throw error;
  });
  return customProvider;
};

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

/** Send through the configured provider. Returns false, and logs the failure, when email is not configured or delivery fails. */
export const sendRegistryAuthEmail = async (email: AuthEmail): Promise<boolean> => {
  if (!registryEmailIsConfigured()) return false;
  const settings = getServerRuntimeConfig().email;
  const options = resolveEnvReferences(settings.options, process.env);

  try {
    const provider = await getEmailProvider(settings, options);
    await provider.send({ from: settings.from!, to: email.to, subject: email.subject, html: renderHtml(email), text: renderText(email) });
    return true;
  } catch (error) {
    console.error(`Email delivery through ${registryEmailProviderName()} failed.`, error);
    return false;
  }
};
