/**
 * Server-only email provider contract. Handoff renders every message, and a provider only delivers it.
 * SMTP is built in. Anything else is a {@link defineEmailProvider} module.
 */

/** One rendered message. */
export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** The pluggable provider contract. `send` throws when the message is not accepted for delivery. */
export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

/** Context passed to a provider factory. */
export interface EmailProviderContext {
  /** `runtime.registry.email.options`, with environment references resolved to their values. */
  options: Record<string, unknown>;
  env: NodeJS.ProcessEnv;
}

/** A custom provider may export the provider directly or a factory that builds it from its context. */
export type EmailProviderFactory = (context: EmailProviderContext) => EmailProvider | Promise<EmailProvider>;
