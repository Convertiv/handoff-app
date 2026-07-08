/**
 * Asset storage settings resolution.
 *
 * `runtime.registry.assetStorage` selects the active provider for **new** uploads: the built-in
 * `database` inline default, the pre-packaged `vercel-blob` adapter, or a `custom` module. Mirrors
 * {@link import('../db/adapter')}: only provider selection, module location, non-secret options, and
 * env-var *names* are ever persisted; secret *values* are read from `process.env` at request time.
 */

import type { Config } from '../../types/config';
import type { AssetStorageProvider } from '../db/schema';

/** Which adapter implementation is active. */
export type AssetStorageAdapterKind = 'database' | 'vercel-blob' | 'custom';

/** The raw, authored settings block (a structural copy of the config type, resolvable from bake). */
export interface AssetStorageSettings {
  adapter?: AssetStorageAdapterKind;
  module?: string;
  tokenEnv?: string;
  maxInlineBytes?: number;
  options?: Record<string, unknown>;
}

/** Default adapter when none is configured. */
export const DEFAULT_ASSET_STORAGE_ADAPTER: AssetStorageAdapterKind = 'database';

/** Default env-var name holding the Vercel Blob read/write token. */
export const DEFAULT_BLOB_TOKEN_ENV = 'BLOB_READ_WRITE_TOKEN';

/** Default max bytes kept inline in Postgres `bytea` (4 MB, under Vercel's ~4.5 MB function limit). */
export const DEFAULT_MAX_INLINE_BYTES = 4 * 1024 * 1024;

/** Fully resolved asset storage settings. */
export interface ResolvedAssetStorage {
  /** The active adapter implementation. */
  adapterKind: AssetStorageAdapterKind;
  /** Provider id recorded on blob rows written by the active adapter (drives read resolution). */
  provider: AssetStorageProvider;
  /** For `custom`: the server-only adapter module path. */
  module?: string;
  /** For `vercel-blob`: the env-var name holding the token. */
  tokenEnv: string;
  /** For `database`: the inline-content size ceiling. */
  maxInlineBytes: number;
  /** Non-secret adapter options. */
  options: Record<string, unknown>;
}

/** The stable provider id recorded on blobs for a custom adapter (single custom provider at a time). */
const customProviderId = (options: Record<string, unknown>): AssetStorageProvider => {
  const id = typeof options.providerId === 'string' && options.providerId.trim() ? options.providerId.trim() : 'custom';
  return id;
};

/** Resolve raw asset storage settings into a fully-defaulted shape. */
export const resolveAssetStorageSettings = (settings: AssetStorageSettings | null | undefined): ResolvedAssetStorage => {
  const adapterKind = settings?.adapter ?? DEFAULT_ASSET_STORAGE_ADAPTER;
  const options = settings?.options ?? {};
  const tokenEnv = settings?.tokenEnv?.trim() || DEFAULT_BLOB_TOKEN_ENV;
  const maxInlineBytes =
    typeof settings?.maxInlineBytes === 'number' && settings.maxInlineBytes > 0 ? settings.maxInlineBytes : DEFAULT_MAX_INLINE_BYTES;

  const provider: AssetStorageProvider =
    adapterKind === 'vercel-blob' ? 'vercel-blob' : adapterKind === 'custom' ? customProviderId(options) : 'database';

  return { adapterKind, provider, module: settings?.module?.trim() || undefined, tokenEnv, maxInlineBytes, options };
};

/** Resolve the active asset storage settings from a loaded config (CLI/build side). */
export const resolveAssetStorageFromConfig = (config: Config | null | undefined): ResolvedAssetStorage =>
  resolveAssetStorageSettings(config?.runtime?.registry?.assetStorage);
