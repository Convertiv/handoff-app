/**
 * Asset storage settings resolution.
 *
 * `runtime.registry.assetStorage` selects the active provider for **new** uploads: the built-in
 * `database` inline default or a `custom` module. The build bakes the provider, the module location,
 * and the options. An option literal is baked as it is. An environment reference stays `{ $env }`
 * and is resolved at request time, before the custom provider factory runs.
 */

import { HandoffConfigError } from '../../config/errors';
import type { ResolvedConfig } from '../../types/config';
import type { AssetStorageProvider } from '../db/schema';

/** The raw, authored settings block (a structural copy of the config type, resolvable from bake). */
export interface AssetStorageSettings {
  provider?: AssetStorageProvider;
  module?: string;
  maxInlineBytes?: number;
  options?: Record<string, unknown>;
}

const PROVIDERS: readonly AssetStorageProvider[] = ['database', 'custom'];

export const DEFAULT_ASSET_STORAGE_PROVIDER: AssetStorageProvider = 'database';

/** Default max bytes kept inline in Postgres `bytea` (4 MB, under Vercel's ~4.5 MB function limit). */
export const DEFAULT_MAX_INLINE_BYTES = 4 * 1024 * 1024;

/** Fully resolved asset storage settings. */
export interface ResolvedAssetStorage {
  /** Recorded on each new blob row as its storage provider. */
  provider: AssetStorageProvider;
  /** For `custom`: the server-only provider module path. */
  module?: string;
  /** For `database`: the inline-content size ceiling. */
  maxInlineBytes: number;
  /** Provider options: literals and `{ $env }` references, never secret values. */
  options: Record<string, unknown>;
}

/** Resolve raw asset storage settings into a fully-defaulted shape. */
export const resolveAssetStorageSettings = (settings: AssetStorageSettings | null | undefined): ResolvedAssetStorage => {
  const provider = settings?.provider ?? DEFAULT_ASSET_STORAGE_PROVIDER;
  const options = settings?.options ?? {};
  const maxInlineBytes =
    typeof settings?.maxInlineBytes === 'number' && settings.maxInlineBytes > 0 ? settings.maxInlineBytes : DEFAULT_MAX_INLINE_BYTES;

  return { provider, module: settings?.module?.trim() || undefined, maxInlineBytes, options };
};

/** Resolve and validate the asset storage block from a loaded config (CLI/build side). An unusable block fails the build. */
export const resolveAssetStorageFromConfig = (config: ResolvedConfig | null | undefined): ResolvedAssetStorage => {
  const settings = config?.runtime?.registry?.assetStorage as Record<string, unknown> | undefined;
  const fail = (problem: string): never => {
    throw new HandoffConfigError(`Config "runtime.registry.assetStorage": ${problem}`);
  };

  const provider = settings?.provider ?? DEFAULT_ASSET_STORAGE_PROVIDER;
  if (!PROVIDERS.includes(provider as AssetStorageProvider)) {
    fail(`unknown provider ${JSON.stringify(provider)}. Use "database" or "custom".`);
  }
  const options = settings?.options;
  if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) {
    fail('"options" must be an object.');
  }
  const module = settings?.module;
  if (provider === 'custom' && (typeof module !== 'string' || !module.trim())) {
    fail('provider "custom" needs a "module" that default-exports a defineStorageProvider() result.');
  }
  const maxInlineBytes = settings?.maxInlineBytes;
  if (maxInlineBytes !== undefined && (typeof maxInlineBytes !== 'number' || !Number.isInteger(maxInlineBytes) || maxInlineBytes <= 0)) {
    fail('"maxInlineBytes" must be a positive whole number.');
  }

  return resolveAssetStorageSettings(settings as AssetStorageSettings | undefined);
};
