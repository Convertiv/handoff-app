/**
 * Server-only asset storage runtime. Resolves the active provider from the baked server runtime
 * config and lazily builds/memoizes adapter instances. Writes use the active adapter; reads resolve
 * by each blob's recorded provider id, so DB-backed (`database`, inline bytea) and object-backed
 * blobs coexist and old blobs stay readable after the active provider changes. `database` is the
 * inline default with no adapter (bytes live directly in `asset_blobs.content`).
 *
 * Imported exclusively by registry API route handlers and the registry store.
 */

import { createVercelBlobStorage } from '@handoff/registry/asset-storage/adapters/vercel-blob';
import { resolveAssetStorageSettings, type ResolvedAssetStorage } from '@handoff/registry/asset-storage/resolve';
import type { AssetStorage, AssetStorageFactory } from '@handoff/registry/asset-storage/types';
import type { AssetStorageProvider } from '@handoff/registry/db/schema';
import { getServerRuntimeConfig } from './docs-api/runtime-config';

let activeCache: ResolvedAssetStorage | null = null;
const adapterCache = new Map<string, AssetStorage | null>();

/** The active, fully-resolved asset storage settings for new uploads. */
export const getActiveAssetStorage = (): ResolvedAssetStorage => {
  if (!activeCache) {
    activeCache = resolveAssetStorageSettings(getServerRuntimeConfig().assetStorage);
  }
  return activeCache;
};

/** Load a custom adapter module and coerce its default export (adapter object or factory) to an adapter. */
const loadCustomAdapter = async (active: ResolvedAssetStorage): Promise<AssetStorage> => {
  if (!active.module) {
    throw new Error('A custom asset storage adapter is selected but no module path is configured.');
  }
  // Traced into the registry bundle at build time; resolved by Node at runtime (see build tracing).
  const mod: any = await import(/* webpackIgnore: true */ active.module);
  const exported = mod?.default ?? mod;
  const adapter: unknown = typeof exported === 'function' ? await (exported as AssetStorageFactory)({ options: active.options, env: process.env }) : exported;
  const candidate = adapter as Partial<AssetStorage> | null;
  if (!candidate || typeof candidate.put !== 'function' || typeof candidate.get !== 'function' || typeof candidate.delete !== 'function') {
    throw new Error(`Custom asset storage module "${active.module}" must default-export a defineAssetStorage adapter.`);
  }
  return candidate as AssetStorage;
};

/**
 * Resolve the {@link AssetStorage} adapter for a provider id, or `null` when the provider is the
 * inline `database` default (there is no adapter; content lives in the DB row). Reading a blob whose
 * provider is no longer configured throws an actionable error rather than silently failing.
 */
export const getAssetStorageAdapter = async (provider: AssetStorageProvider): Promise<AssetStorage | null> => {
  if (provider === 'database') {
    return null;
  }
  if (adapterCache.has(provider)) {
    return adapterCache.get(provider) ?? null;
  }

  const active = getActiveAssetStorage();
  let adapter: AssetStorage;
  if (provider === 'vercel-blob') {
    adapter = createVercelBlobStorage({ tokenEnv: active.tokenEnv, options: active.options });
  } else if (active.adapterKind === 'custom' && active.provider === provider) {
    adapter = await loadCustomAdapter(active);
  } else {
    throw new Error(
      `No asset storage adapter is configured for provider "${provider}". A blob was stored by that ` +
        'provider but it is no longer selected. Restore its configuration (or migrate its objects) to read it.'
    );
  }

  adapterCache.set(provider, adapter);
  return adapter;
};

/** The adapter for the active provider (used for new uploads), or `null` for the inline database default. */
export const getActiveAssetStorageAdapter = (): Promise<AssetStorage | null> => getAssetStorageAdapter(getActiveAssetStorage().provider);

/** Reset memoized state (test seam only). */
export const __resetAssetStorageCache = (): void => {
  activeCache = null;
  adapterCache.clear();
};
