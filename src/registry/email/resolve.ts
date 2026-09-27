/**
 * Registry email settings resolution.
 *
 * `runtime.registry.email.provider` selects the built-in `resend` or `smtp` provider, or a `custom`
 * module. The build bakes the provider, the module location, and the options. An option literal is
 * baked as it is. An environment reference stays `{ $env }` and is resolved at request time.
 */

import { HandoffConfigError } from '../../config/errors';
import { isEnvReference } from '../../config/from-env';
import type { ResolvedConfig } from '../../types/config';

export type EmailProviderKind = 'resend' | 'smtp' | 'custom';

export const DEFAULT_EMAIL_PROVIDER: EmailProviderKind = 'resend';

/** Default env-var name holding the Resend API key. */
export const DEFAULT_RESEND_API_KEY_ENV = 'RESEND_API_KEY';

const PROVIDERS: readonly EmailProviderKind[] = ['resend', 'smtp', 'custom'];

/** The options each built-in provider accepts. A custom provider accepts any. */
const BUILT_IN_OPTIONS: Record<Exclude<EmailProviderKind, 'custom'>, readonly string[]> = {
  resend: ['apiKey'],
  smtp: ['host', 'port', 'secure', 'user', 'password'],
};

/** Email settings as they are baked: literals and `{ $env }` references, never secret values. */
export interface EmailSettings {
  from?: string;
  provider: EmailProviderKind;
  /** For `custom`: the server-only provider module path. */
  module?: string;
  options: Record<string, unknown>;
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Resolve and validate the email block from a loaded config (CLI/build side). An unusable block fails the build. */
export const resolveEmailFromConfig = (config: ResolvedConfig | null | undefined): EmailSettings => {
  const email = config?.runtime?.registry?.email as Record<string, unknown> | undefined;
  const fail = (problem: string): never => {
    throw new HandoffConfigError(`Config "runtime.registry.email": ${problem}`);
  };

  const provider = (email?.provider ?? DEFAULT_EMAIL_PROVIDER) as EmailProviderKind;
  if (!PROVIDERS.includes(provider)) {
    fail(`unknown provider ${JSON.stringify(provider)}. Use "resend", "smtp" or "custom".`);
  }
  if (email?.options !== undefined && !isPlainRecord(email.options)) {
    fail('"options" must be an object.');
  }
  const options = { ...((email?.options as Record<string, unknown> | undefined) ?? {}) };
  const module = typeof email?.module === 'string' ? email.module.trim() : undefined;

  if (provider === 'custom') {
    if (!module) fail('provider "custom" needs a "module" that default-exports a defineEmailProvider() result.');
  } else {
    if (email?.module !== undefined) fail(`"module" is used only by provider "custom", not "${provider}".`);
    const allowed = BUILT_IN_OPTIONS[provider];
    const unknown = Object.keys(options).filter((key) => !allowed.includes(key));
    if (unknown.length > 0) {
      fail(
        `provider "${provider}" does not support ${unknown.map((key) => `"options.${key}"`).join(', ')}. ` +
          `Use ${allowed.map((key) => `"${key}"`).join(', ')}.`
      );
    }
  }
  if (provider === 'smtp' && options.host === undefined) fail('provider "smtp" needs "options.host".');
  if (provider === 'resend' && options.apiKey === undefined) options.apiKey = { $env: DEFAULT_RESEND_API_KEY_ENV };

  const from = typeof email?.from === 'string' ? email.from.trim() || undefined : undefined;
  return { from, provider, ...(module ? { module } : {}), options };
};

/** Read baked settings back leniently (server side): a malformed value must not take the server down. */
export const parseEmailSettings = (raw: { from?: unknown; provider?: unknown; module?: unknown; options?: unknown }): EmailSettings => {
  let options: unknown = raw.options;
  if (typeof options === 'string') {
    try {
      options = options.trim() ? JSON.parse(options) : {};
    } catch {
      options = {};
    }
  }
  const provider = PROVIDERS.find((kind) => kind === raw.provider) ?? DEFAULT_EMAIL_PROVIDER;
  const module = typeof raw.module === 'string' ? raw.module.trim() : '';
  return {
    from: typeof raw.from === 'string' ? raw.from.trim() || undefined : undefined,
    provider,
    ...(module ? { module } : {}),
    options: isPlainRecord(options) ? options : {},
  };
};

/** Replace each `{ $env }` reference with its value from `env`. An unset or empty variable becomes `undefined`. */
export const resolveEmailOptions = (options: Record<string, unknown>, env: NodeJS.ProcessEnv): Record<string, unknown> => {
  const resolve = (value: unknown): unknown => {
    if (isEnvReference(value)) {
      const resolved = typeof value.$env === 'string' ? env[value.$env]?.trim() : undefined;
      return resolved || undefined;
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (isPlainRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolve(entry)]));
    return value;
  };
  return resolve(options) as Record<string, unknown>;
};

/** The env-var names that the options reference, for deployment instructions. */
export const emailOptionEnvNames = (options: Record<string, unknown>): string[] => {
  const names = new Set<string>();
  const collect = (value: unknown): void => {
    if (isEnvReference(value)) {
      if (typeof value.$env === 'string') names.add(value.$env);
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (isPlainRecord(value)) {
      Object.values(value).forEach(collect);
    }
  };
  collect(options);
  return [...names];
};
