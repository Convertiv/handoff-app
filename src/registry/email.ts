import type { ResolvedConfig } from '../types/config';

/** Default env-var name holding the Resend API key. */
export const DEFAULT_EMAIL_API_KEY_ENV = 'RESEND_API_KEY';

/** Non-secret email settings baked into the registry build. The API key is read from `apiKeyEnv` at request time. */
export interface EmailSettings {
  from?: string;
  apiKeyEnv: string;
}

export const resolveEmailFromConfig = (config: ResolvedConfig | null | undefined): EmailSettings => {
  const email = config?.runtime?.registry?.email;
  return {
    from: email?.from?.trim() || undefined,
    apiKeyEnv: email?.apiKey?.$env?.trim() || DEFAULT_EMAIL_API_KEY_ENV,
  };
};
