/**
 * Bundled Drizzle client + migrator for the registry database.
 *
 * The package ships both built-in adapters (`pg` and `neon`) and the Drizzle client/migrator, so a
 * consuming project needs no global Drizzle install or separate CLI. Driver modules are loaded
 * lazily (dynamic import) for the selected adapter only, so workspace dev/build never pulls the
 * Postgres/Neon drivers into memory when the registry is not in use.
 */

import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RegistryDatabaseAdapter } from './adapter';
import * as schema from './schema';

/** Typed Drizzle database over the registry schema, regardless of which adapter backs it. */
export type RegistryDatabase = NodePgDatabase<typeof schema> | NeonDatabase<typeof schema>;

/** A live registry database connection plus its lifecycle operations. */
export interface RegistryDbConnection {
  /** Selected adapter that produced this connection. */
  adapter: RegistryDatabaseAdapter;
  /** Typed Drizzle database. */
  db: RegistryDatabase;
  /** Apply the package-owned migrations found in `migrationsFolder`. */
  migrate(migrationsFolder: string): Promise<void>;
  /** Close the underlying connection pool. */
  close(): Promise<void>;
}

export interface CreateRegistryDbConnectionParams {
  adapter: RegistryDatabaseAdapter;
  connectionString: string;
}

/**
 * Create a registry database connection for the resolved adapter. Both adapters target the
 * Postgres dialect and share the same schema, so the returned connection is interchangeable for
 * migration and (later) the registry store.
 */
export const createRegistryDbConnection = async ({
  adapter,
  connectionString,
}: CreateRegistryDbConnectionParams): Promise<RegistryDbConnection> => {
  if (adapter === 'neon') {
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    // Neon's serverless driver needs a WebSocket constructor in Node; reuse the bundled `ws`.
    const ws = await import('ws');
    neonConfig.webSocketConstructor = (ws as any).default ?? ws;
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { migrate } = await import('drizzle-orm/neon-serverless/migrator');

    const pool = new Pool({ connectionString });
    const db = drizzle(pool, { schema });

    return {
      adapter,
      db,
      migrate: (migrationsFolder: string) => migrate(db, { migrationsFolder }),
      close: () => pool.end(),
    };
  }

  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return {
    adapter,
    db,
    migrate: (migrationsFolder: string) => migrate(db, { migrationsFolder }),
    close: () => pool.end(),
  };
};
