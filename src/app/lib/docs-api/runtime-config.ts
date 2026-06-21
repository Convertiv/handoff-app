import fs from 'fs-extra';
import path from 'path';
import type { RuntimeMode } from '@handoff/types/config';
import {
  DEFAULT_DATABASE_URL_ENV,
  DEFAULT_REGISTRY_ADAPTER,
  type RegistryDatabaseAdapter,
} from '@handoff/registry/db/adapter';

/**
 * Server-side runtime resolution for the docs read API (technical design §1/§5, issue #10).
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
}

/** Resolved server-side runtime configuration for the docs read API. */
export interface ServerRuntimeConfig {
  mode: RuntimeMode;
  registry: ServerRegistryRuntimeConfig;
}

let cached: ServerRuntimeConfig | null = null;

/** Safe defaults: workspace mode with the default Postgres adapter + `DATABASE_URL` env var. */
const defaults = (): ServerRuntimeConfig => ({
  mode: 'workspace',
  registry: { adapter: DEFAULT_REGISTRY_ADAPTER, databaseUrlEnv: DEFAULT_DATABASE_URL_ENV },
});

/** Absolute path of the server-only runtime config persisted next to `client.config.json`. */
const serverRuntimeConfigPath = (): string =>
  path.resolve(
    process.env.HANDOFF_MODULE_PATH ?? '',
    '.handoff',
    process.env.HANDOFF_PROJECT_ID ?? '',
    'runtime.server.json'
  );

/**
 * Resolve the server-side runtime config, reading `runtime.server.json` when present and falling
 * back to safe workspace defaults otherwise (so an app built before this file existed keeps
 * behaving as a workspace). The result is cached for the lifetime of the server process.
 */
export const getServerRuntimeConfig = (): ServerRuntimeConfig => {
  if (cached) {
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
      cached = {
        mode: parsed?.mode === 'registry' ? 'registry' : 'workspace',
        registry: {
          adapter: parsed?.registry?.adapter === 'neon' ? 'neon' : 'pg',
          databaseUrlEnv,
        },
      };
      return cached;
    }
  } catch {
    // Fall through to defaults on any read/parse failure.
  }

  cached = defaults();
  return cached;
};
