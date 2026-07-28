/**
 * Registry database driver resolution.
 *
 * PostgreSQL is the supported database. `runtime.registry.database.driver` selects one of two
 * built-in connection drivers shipped with the `handoff-app` package — `pg` (default) and `neon` —
 * both targeting the same Postgres dialect over one package-owned schema and migration set. The
 * driver picks *how* to connect, not *which* database engine to use. `build --target registry` and
 * `db:migrate` resolve the **same** driver so build and migration never diverge. Connection
 * credentials are referenced by environment-variable name only and resolved to a value at runtime;
 * the value is never stored in config.
 */

import type { Config } from '../../types/config';

/** Built-in registry database connection driver. Both ship with the package and target Postgres. */
export type RegistryDatabaseDriver = 'pg' | 'neon';

/** Default env-var name holding the database connection string. */
export const DEFAULT_DATABASE_URL_ENV = 'DATABASE_URL';

/** @deprecated Fixed registry server secrets are no longer authorized. */
export const DEFAULT_REGISTRY_API_TOKEN_ENV = 'HANDOFF_REGISTRY_API_TOKEN';

/** Default registry database driver when none is configured. */
export const DEFAULT_REGISTRY_DRIVER: RegistryDatabaseDriver = 'pg';

/** Fully resolved registry database connection inputs. */
export interface ResolvedRegistryDatabase {
  /** Selected built-in driver. */
  driver: RegistryDatabaseDriver;
  /** Name of the env var the connection string was read from. */
  databaseUrlEnv: string;
  /** Resolved connection string (never persisted in config). */
  connectionString: string;
}

/** Resolve the env-var name holding the database URL (defaults to `DATABASE_URL`). */
export const resolveDatabaseUrlEnv = (config: Config | null | undefined): string => {
  const configured = config?.runtime?.registry?.databaseUrlEnv?.trim();
  return configured || DEFAULT_DATABASE_URL_ENV;
};

/**
 * Resolve the legacy fixed-token env-var name for configuration compatibility.
 *
 * @deprecated The returned env var is intentionally ignored by registry authorization. Use a
 * user-issued access token or `handoff-app login`.
 */
export const resolveApiTokenEnv = (config: Config | null | undefined): string => {
  const configured = config?.runtime?.registry?.apiTokenEnv?.trim();
  return configured || DEFAULT_REGISTRY_API_TOKEN_ENV;
};

/** Resolve the configured registry database driver (defaults to `pg`). */
export const resolveRegistryDriver = (config: Config | null | undefined): RegistryDatabaseDriver => {
  return config?.runtime?.registry?.database?.driver ?? DEFAULT_REGISTRY_DRIVER;
};

/**
 * Resolve the registry database connection from config + environment. Throws an actionable error
 * when the configured env var is unset so the CLI can surface a clear "missing database URL"
 * message instead of failing deep inside the driver.
 */
export const resolveRegistryDatabase = (config: Config | null | undefined): ResolvedRegistryDatabase => {
  const driver = resolveRegistryDriver(config);
  const databaseUrlEnv = resolveDatabaseUrlEnv(config);
  const connectionString = process.env[databaseUrlEnv]?.trim();

  if (!connectionString) {
    throw new Error(
      `Registry database URL is not configured. Set the "${databaseUrlEnv}" environment variable to a ` +
        `PostgreSQL connection string (or change "runtime.registry.databaseUrlEnv" to point at the env var you use).`
    );
  }

  return { driver, databaseUrlEnv, connectionString };
};
