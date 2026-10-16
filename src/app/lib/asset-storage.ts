/**
 * Server-only asset storage runtime. Resolves the active provider from the baked server runtime
 * config and lazily builds and memoizes it. Writes use the active provider. Reads resolve by each
 * blob's recorded provider, so `database` blobs (inline bytea) stay readable when a `custom` provider
 * is active. `database` has no module: its bytes live directly in `asset_blobs.content`.
 *
 * Imported exclusively by registry API route handlers and the registry store.
 */

import { resolveAssetStorageSettings, type ResolvedAssetStorage } from '@handoff/registry/asset-storage/resolve';
import type { StorageProvider } from '@handoff/registry/asset-storage/types';
import type { AssetStorageProvider } from '@handoff/registry/db/schema';
import { getServerRuntimeConfig } from './docs-api/runtime-config';
import { loadServerModule } from './server-module';

let activeCache: ResolvedAssetStorage | null = null;
const providerCache = new Map<string, StorageProvider | null>();

/** The active, fully-resolved asset storage settings for new uploads. */
export const getActiveAssetStorage = (): ResolvedAssetStorage => {
  if (!activeCache) {
    activeCache = resolveAssetStorageSettings(getServerRuntimeConfig().assetStorage);
  }
  return activeCache;
};

/** A storage configuration error whose message is safe to show to a client. */
export class AssetStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetStorageError';
  }
}

/** Load a custom provider module and coerce its default export (provider object or factory) to a provider. */
const loadCustomProvider = async (active: ResolvedAssetStorage): Promise<StorageProvider> => {
  if (!active.module) {
    throw new AssetStorageError('A custom asset storage provider is selected but no module path is configured.');
  }
  const candidate = (await loadServerModule(active.module, { options: active.options })) as Partial<StorageProvider> | null;
  if (!candidate || typeof candidate.put !== 'function' || typeof candidate.get !== 'function' || typeof candidate.delete !== 'function') {
    throw new AssetStorageError(`Custom asset storage module "${active.module}" must default-export a defineStorageProvider() result.`);
  }
  return candidate as StorageProvider;
};

/**
 * Resolve the {@link StorageProvider} for a recorded provider, or `null` when the provider is the
 * inline `database` default (there is no module; content lives in the DB row). Reading a blob whose
 * provider is no longer configured throws an actionable error rather than silently failing.
 */
export const getStorageProvider = async (provider: AssetStorageProvider): Promise<StorageProvider | null> => {
  if (provider === 'database') {
    return null;
  }
  if (providerCache.has(provider)) {
    return providerCache.get(provider) ?? null;
  }

  const active = getActiveAssetStorage();
  if (active.provider !== provider) {
    throw new AssetStorageError(
      `No asset storage module is configured for provider "${provider}". A blob was stored by that ` +
        'provider but it is no longer selected. Restore its configuration to read it.'
    );
  }
  const storage = await loadCustomProvider(active);

  providerCache.set(provider, storage);
  return storage;
};

/** The active provider (used for new uploads), or `null` for the inline database default. */
export const getActiveStorageProvider = (): Promise<StorageProvider | null> => getStorageProvider(getActiveAssetStorage().provider);

/** Reset memoized state (test seam only). */
export const __resetAssetStorageCache = (): void => {
  activeCache = null;
  providerCache.clear();
};
