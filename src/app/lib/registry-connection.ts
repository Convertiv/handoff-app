import { createRegistryDbConnection, type RegistryDbConnection } from '@handoff/registry/db/client';
import { getServerRuntimeConfig } from './docs-api/runtime-config';

/**
 * Shared, process-lifetime registry database connection.
 *
 * Both the registry-mode docs read API and the registry management API resolve their database
 * through this single helper so one connection pool backs the whole registry runtime rather than
 * one pool per consumer. The connection string is read from the configured env var *name* at
 * request time — never persisted in config — and the selected driver comes from the server runtime
 * config baked at build time.
 *
 * Server-only: imported exclusively by registry-mode API route helpers, which are themselves only
 * reached after the runtime-mode guard, so the Drizzle/Postgres driver code never loads in
 * workspace dev/build.
 */

/**
 * Thrown when the registry database cannot be reached — a missing connection-string env var or a
 * failed connect. Distinct from generic failures so callers can map it to the management API's
 * `database_unavailable` (503) contract rather than a `500`.
 */
export class RegistryConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryConnectionError';
  }
}

let connectionPromise: Promise<RegistryDbConnection> | null = null;

/**
 * Open (or reuse) the registry database connection. A missing env var surfaces as an actionable
 * {@link RegistryConnectionError} rather than a deep driver failure. A failed connect is not cached,
 * so a later request can retry once the database/env is available.
 */
export const getRegistryConnection = (): Promise<RegistryDbConnection> => {
  if (connectionPromise) {
    return connectionPromise;
  }
  const { registry } = getServerRuntimeConfig();
  const connectionString = process.env[registry.databaseUrlEnv]?.trim();
  if (!connectionString) {
    return Promise.reject(
      new RegistryConnectionError(
        `Registry database URL is not configured. Set the "${registry.databaseUrlEnv}" environment ` +
          `variable to a PostgreSQL connection string to serve the registry API.`
      )
    );
  }
  connectionPromise = createRegistryDbConnection({ driver: registry.driver, connectionString, serving: true }).catch((error) => {
    connectionPromise = null;
    // TODO: Route server errors through the shared logger.
    console.error('Registry database connection failed.', error);
    throw new RegistryConnectionError('Registry database is unavailable.');
  });
  return connectionPromise;
};
