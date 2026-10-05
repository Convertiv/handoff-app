/**
 * Asset storage settings resolution.
 *
 * `runtime.registry.assetStorage` selects the active provider for **new** uploads: the built-in
 * `database` inline default or a `custom` module. The build bakes the adapter, the module location,
 * and the options. An option literal is baked as it is. An environment reference stays `{ $env }`
 * and is resolved at request time, before the custom adapter factory runs.
 */

import type { ResolvedConfig } from '../../types/config';
import type { AssetStorageProvider } from '../db/schema';

/** Which adapter implementation is active. Recorded on each blob row as its storage provider. */
export type AssetStorageAdapterKind = AssetStorageProvider;

/** The raw, authored settings block (a structural copy of the config type, resolvable from bake). */
export interface AssetStorageSettings {
  adapter?: AssetStorageAdapterKind;
  module?: string;
  maxInlineBytes?: number;
  options?: Record<string, unknown>;
}

/** Default adapter when none is configured. */
export const DEFAULT_ASSET_STORAGE_ADAPTER: AssetStorageAdapterKind = 'database';

/** Default max bytes kept inline in Postgres `bytea` (4 MB, under Vercel's ~4.5 MB function limit). */
export const DEFAULT_MAX_INLINE_BYTES = 4 * 1024 * 1024;

/** Fully resolved asset storage settings. */
export interface ResolvedAssetStorage {
  /** The active adapter implementation. */
  adapterKind: AssetStorageAdapterKind;
  /** For `custom`: the server-only adapter module path. */
  module?: string;
  /** For `database`: the inline-content size ceiling. */
  maxInlineBytes: number;
  /** Adapter options: literals and `{ $env }` references, never secret values. */
  options: Record<string, unknown>;
}

/** Resolve raw asset storage settings into a fully-defaulted shape. */
export const resolveAssetStorageSettings = (settings: AssetStorageSettings | null | undefined): ResolvedAssetStorage => {
  const adapterKind = settings?.adapter ?? DEFAULT_ASSET_STORAGE_ADAPTER;
  const options = settings?.options ?? {};
  const maxInlineBytes =
    typeof settings?.maxInlineBytes === 'number' && settings.maxInlineBytes > 0 ? settings.maxInlineBytes : DEFAULT_MAX_INLINE_BYTES;

  return { adapterKind, module: settings?.module?.trim() || undefined, maxInlineBytes, options };
};

/** Resolve the active asset storage settings from a loaded config (CLI/build side). */
export const resolveAssetStorageFromConfig = (config: ResolvedConfig | null | undefined): ResolvedAssetStorage =>
  resolveAssetStorageSettings(config?.runtime?.registry?.assetStorage);
