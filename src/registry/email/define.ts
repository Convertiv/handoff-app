/**
 * Typed identity helper for custom email providers (mirrors `defineStorageProvider`): a consumer
 * default-exports its result from a **server-only** module and points `runtime.registry.email.module`
 * at it. It must be its own module (not an inline `defineConfig` function) so the build can trace it
 * into the deployed registry. The default export may be the provider object, or a factory
 * `(context) => EmailProvider` when it needs its options or env.
 */

import type { EmailProvider, EmailProviderFactory } from './types';

export function defineEmailProvider(provider: EmailProvider): EmailProvider;
export function defineEmailProvider(factory: EmailProviderFactory): EmailProviderFactory;
export function defineEmailProvider(input: EmailProvider | EmailProviderFactory): EmailProvider | EmailProviderFactory {
  return input;
}
