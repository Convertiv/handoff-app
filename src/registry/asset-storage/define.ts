/**
 * Typed identity helper for custom asset storage providers (mirrors `defineCatalogItem`): a consumer
 * default-exports its result from a **server-only** module and points
 * `runtime.registry.assetStorage.module` at it. It must be its own module (not an inline
 * `defineConfig` function) so the build can trace it into the deployed registry. The default export
 * may be the provider object, or a factory `(context) => StorageProvider` when it needs its options/env.
 */

import type { StorageProvider, StorageProviderFactory } from './types';

export function defineStorageProvider(provider: StorageProvider): StorageProvider;
export function defineStorageProvider(factory: StorageProviderFactory): StorageProviderFactory;
export function defineStorageProvider(input: StorageProvider | StorageProviderFactory): StorageProvider | StorageProviderFactory {
  return input;
}
