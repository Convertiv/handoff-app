import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { aiCredentialKind, type AiConnectionSettings } from '@handoff/ai/connections';

import type { AiProvider, AiProviderFactory } from '@handoff/ai/types';
import type { LanguageModel } from 'ai';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

/**
 * Server-only model construction.
 *
 * Every built-in connection speaks the OpenAI-compatible `/chat/completions` API. A connection that
 * fits nothing else names a `defineAiProvider()` module instead of a base URL.
 *
 * The base URL always comes from the config, never from the request, so the server can never be
 * made to call an endpoint a reader chose.
 */

/** Thrown when a connection cannot be used as configured. The message is safe to show the reader. */
export class AiConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConnectionError';
  }
}

/**
 * The key to send for this connection: the deployment's own for a service connection, this reader's
 * for a `credential: 'user'` one, and none where the endpoint needs none.
 *
 * The registry data layer is imported lazily so its Postgres dependencies stay out of the workspace
 * path.
 */
export const resolveAiKey = async (connection: AiConnectionSettings, userId: string | null): Promise<string | undefined> => {
  const credential = aiCredentialKind(connection);
  if (credential === 'none') return undefined;
  if (credential === 'service') {
    const key = connection.apiKeyEnv ? process.env[connection.apiKeyEnv]?.trim() : undefined;
    if (!key) {
      throw new AiConnectionError(`${connection.label} is not available: its API key environment variable is not set.`);
    }
    return key;
  }
  if (!userId || getServerRuntimeConfig().mode !== 'registry') {
    throw new AiConnectionError(`${connection.label} needs your own API key, and this deployment has no place to store one.`);
  }
  const [{ getRegistryConnection }, { readRegistryAiKey }] = await Promise.all([
    import('../registry-connection'),
    import('@handoff/registry/auth'),
  ]);
  const { db } = await getRegistryConnection();
  const key = await readRegistryAiKey(db, { userId, connectionId: connection.id });
  if (!key) {
    throw new AiConnectionError(`Add your ${connection.label} API key on the AI providers page before using this model.`);
  }
  return key;
};

/** Load a custom provider module and coerce its default export (provider object or factory) to a provider. */
const loadProviderModule = async (connection: AiConnectionSettings, apiKey: string | undefined): Promise<AiProvider> => {
  // Traced into the registry bundle at build time; resolved by Node at runtime (see build tracing).
  const mod: any = await import(/* webpackIgnore: true */ connection.module!);
  const exported = mod?.default ?? mod;
  const provider: unknown =
    typeof exported === 'function'
      ? await (exported as AiProviderFactory)({ options: connection.options ?? {}, env: process.env, apiKey })
      : exported;
  const candidate = provider as Partial<AiProvider> | null;
  if (!candidate || typeof candidate.languageModel !== 'function') {
    throw new AiConnectionError(`Custom AI provider module "${connection.module}" must default-export a defineAiProvider provider.`);
  }
  return candidate as AiProvider;
};

/** Build the language model for one declared connection and one of its declared models. */
export const createAiLanguageModel = async (
  connection: AiConnectionSettings,
  model: string,
  userId: string | null
): Promise<LanguageModel> => {
  const apiKey = await resolveAiKey(connection, userId);
  if (connection.module) {
    return (await loadProviderModule(connection, apiKey)).languageModel(model);
  }
  return createOpenAICompatible({ name: connection.id, baseURL: connection.baseUrl!, apiKey }).chatModel(model);
};
