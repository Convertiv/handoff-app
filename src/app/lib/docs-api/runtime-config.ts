import fs from 'fs-extra';
import path from 'path';
import type { RuntimeMode } from '@handoff/types/config';
import {
  DEFAULT_DATABASE_URL_ENV,
  DEFAULT_REGISTRY_ADAPTER,
  DEFAULT_REGISTRY_API_TOKEN_ENV,
  type RegistryDatabaseAdapter,
} from '@handoff/registry/db/adapter';
import { DEFAULT_ASSET_STORAGE_ADAPTER, type AssetStorageSettings } from '@handoff/registry/asset-storage/resolve';

/**
 * Server-side runtime resolution for the docs read API.
 *
 * The docs read API is mode-aware: workspace mode resolves artifacts from generated filesystem
 * files, registry mode resolves them from the database. The browser-facing `client.config.json`
 * carries only the resolved {@link RuntimeMode} (no connection details), so the server needs its
 * own non-secret source for the registry connection *inputs* — the selected adapter and the *name*
 * of the env var holding the database URL. The build persists these to `runtime.server.json`
 * alongside `client.config.json`; this module reads them back, never crossing secrets to the
 * browser (the connection-string value is resolved from the env var at request time, not here).
 *
 * Server-only: imported exclusively by API route handlers and their helpers.
 */

/** Non-secret registry connection inputs resolved on the server. */
export interface ServerRegistryRuntimeConfig {
  /** Selected built-in database adapter. */
  adapter: RegistryDatabaseAdapter;
  /** Name of the env var holding the database connection string (value resolved at request time). */
  databaseUrlEnv: string;
  /**
   * Name of the env var holding the registry management API bearer token. The token *value* is
   * resolved from the environment at request time by the management API guard — never persisted.
   */
  apiTokenEnv: string;
}

/** Resolved server-side runtime configuration for the docs read API. */
export interface ServerRuntimeConfig {
  mode: RuntimeMode;
  registry: ServerRegistryRuntimeConfig;
  /**
   * Asset storage selection for registry mode (provider + non-secret options + env-var names). Secret
   * values are resolved from `process.env` at request time, never persisted here.
   */
  assetStorage: AssetStorageSettings;
}

let cached: ServerRuntimeConfig | null = null;

/** Safe defaults: workspace mode with the default Postgres adapter + `DATABASE_URL` env var. */
const defaults = (): ServerRuntimeConfig => ({
  mode: 'workspace',
  registry: {
    adapter: DEFAULT_REGISTRY_ADAPTER,
    databaseUrlEnv: DEFAULT_DATABASE_URL_ENV,
    apiTokenEnv: DEFAULT_REGISTRY_API_TOKEN_ENV,
  },
  assetStorage: { adapter: DEFAULT_ASSET_STORAGE_ADAPTER },
});

/** Parse the baked asset-storage selection from env (names/selectors only; JSON options tolerated). */
const assetStorageFromEnv = (): AssetStorageSettings => {
  const adapter = process.env.HANDOFF_ASSET_STORAGE_ADAPTER?.trim();
  let options: Record<string, unknown> | undefined;
  const rawOptions = process.env.HANDOFF_ASSET_STORAGE_OPTIONS?.trim();
  if (rawOptions) {
    try {
      const parsed = JSON.parse(rawOptions);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) options = parsed as Record<string, unknown>;
    } catch {
      // Ignore malformed baked options rather than crash the server.
    }
  }
  const maxInline = Number(process.env.HANDOFF_ASSET_STORAGE_MAX_INLINE_BYTES);
  return {
    adapter: adapter === 'vercel-blob' || adapter === 'custom' ? adapter : DEFAULT_ASSET_STORAGE_ADAPTER,
    module: process.env.HANDOFF_ASSET_STORAGE_MODULE?.trim() || undefined,
    tokenEnv: process.env.HANDOFF_ASSET_STORAGE_TOKEN_ENV?.trim() || undefined,
    maxInlineBytes: Number.isFinite(maxInline) && maxInline > 0 ? maxInline : undefined,
    options,
  };
};

/** Absolute path of the server-only runtime config persisted next to `client.config.json`. */
const serverRuntimeConfigPath = (): string =>
  path.resolve(
    process.env.HANDOFF_MODULE_PATH ?? '',
    '.handoff',
    process.env.HANDOFF_PROJECT_ID ?? '',
    'runtime.server.json'
  );

/**
 * Resolve the server-side runtime config from the values baked into the bundle at build time
 * (`HANDOFF_RUNTIME_MODE` + registry connection inputs). Returns `null` when no mode was baked, so
 * the file-based path can take over for apps built before env baking existed.
 *
 * This is the resolution path for the packaged registry app: its deploy host has none of
 * the build-machine paths `runtime.server.json` is keyed on, so mode + the DB env-var *name* are
 * carried in the bundle instead. Mode stays config-only — these were derived from `runtime.*` at
 * build, never inferred from the deploy environment.
 */
const fromEnv = (): ServerRuntimeConfig | null => {
  const mode = process.env.HANDOFF_RUNTIME_MODE?.trim();
  if (!mode) {
    return null;
  }
  const databaseUrlEnv = process.env.HANDOFF_REGISTRY_DATABASE_URL_ENV?.trim() || DEFAULT_DATABASE_URL_ENV;
  const apiTokenEnv = process.env.HANDOFF_REGISTRY_API_TOKEN_ENV?.trim() || DEFAULT_REGISTRY_API_TOKEN_ENV;
  return {
    mode: mode === 'registry' ? 'registry' : 'workspace',
    registry: {
      adapter: process.env.HANDOFF_REGISTRY_ADAPTER?.trim() === 'neon' ? 'neon' : 'pg',
      databaseUrlEnv,
      apiTokenEnv,
    },
    assetStorage: assetStorageFromEnv(),
  };
};

/**
 * Resolve the server-side runtime config, preferring the values baked into the bundle, then reading
 * `runtime.server.json` when present, and falling back to safe workspace defaults otherwise (so an
 * app built before either source existed keeps behaving as a workspace). The result is cached for
 * the lifetime of the server process.
 */
export const getServerRuntimeConfig = (): ServerRuntimeConfig => {
  if (cached) {
    return cached;
  }

  const envConfig = fromEnv();
  if (envConfig) {
    cached = envConfig;
    return cached;
  }

  try {
    const file = serverRuntimeConfigPath();
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<ServerRuntimeConfig>;
      const databaseUrlEnv =
        typeof parsed?.registry?.databaseUrlEnv === 'string' && parsed.registry.databaseUrlEnv.trim()
          ? parsed.registry.databaseUrlEnv.trim()
          : DEFAULT_DATABASE_URL_ENV;
      const apiTokenEnv =
        typeof parsed?.registry?.apiTokenEnv === 'string' && parsed.registry.apiTokenEnv.trim()
          ? parsed.registry.apiTokenEnv.trim()
          : DEFAULT_REGISTRY_API_TOKEN_ENV;
      const assetStorage: AssetStorageSettings =
        parsed?.assetStorage && typeof parsed.assetStorage === 'object'
          ? parsed.assetStorage
          : { adapter: DEFAULT_ASSET_STORAGE_ADAPTER };
      cached = {
        mode: parsed?.mode === 'registry' ? 'registry' : 'workspace',
        registry: {
          adapter: parsed?.registry?.adapter === 'neon' ? 'neon' : 'pg',
          databaseUrlEnv,
          apiTokenEnv,
        },
        assetStorage,
      };
      return cached;
    }
  } catch {
    // Fall through to defaults on any read/parse failure.
  }

  cached = defaults();
  return cached;
};
