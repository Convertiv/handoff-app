/**
 * Typed identity helper for custom AI providers (mirrors `defineAssetStorage`): a consumer
 * default-exports its result from a **server-only** module and points a connection's `module` at
 * it. It must be its own module (not an inline `defineConfig` function) so the build can trace it
 * into the deployed registry. The default export may be the provider object, or a factory
 * `(context) => AiProvider` when it needs its options, env or the resolved key.
 */

import type { AiProvider, AiProviderFactory } from './types';

export function defineAiProvider(provider: AiProvider): AiProvider;
export function defineAiProvider(factory: AiProviderFactory): AiProviderFactory;
export function defineAiProvider(input: AiProvider | AiProviderFactory): AiProvider | AiProviderFactory {
  return input;
}
