/**
 * Bundled Drizzle client + migrator for the registry database.
 *
 * The package ships both built-in drivers (`pg` and `neon`) and the Drizzle client/migrator, so a
 * consuming project needs no global Drizzle install or separate CLI. Driver modules are loaded
 * lazily (dynamic import) for the selected driver only, so workspace dev/build never pulls the
 * Postgres/Neon drivers into memory when the registry is not in use.
 */

import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RegistryDatabaseDriver } from './driver';
import * as schema from './schema';

/** Typed Drizzle database over the registry schema, regardless of which driver backs it. */
export type RegistryDatabase = NodePgDatabase<typeof schema> | NeonDatabase<typeof schema>;

/** A live registry database connection plus its lifecycle operations. */
export interface RegistryDbConnection {
  /** Selected driver that produced this connection. */
  driver: RegistryDatabaseDriver;
  /** Typed Drizzle database. */
  db: RegistryDatabase;
  /** Apply the package-owned migrations found in `migrationsFolder`. */
  migrate(migrationsFolder: string): Promise<void>;
  /** Close the underlying connection pool. */
  close(): Promise<void>;
}

export interface CreateRegistryDbConnectionParams {
  driver: RegistryDatabaseDriver;
  connectionString: string;
  /**
   * Apply {@link SERVING_POOL_LIMITS}. `db:migrate` leaves this unset, because a migration statement can run for
   * minutes.
   */
  serving?: boolean;
}

/**
 * One pool backs the anonymous docs read API, the authenticated management API, and every auth query, so a request
 * must not hold a connection, or wait for one, without a deadline.
 *
 * `statement_timeout` bounds one statement, not a transaction, so it does not cut a publish short — an ingest is many
 * small row writes in one transaction. `connectionTimeoutMillis` makes a saturated pool fail a request instead of
 * queueing it forever, which is the `pg` default.
 */
const SERVING_POOL_LIMITS = {
  statement_timeout: 15_000,
  connectionTimeoutMillis: 5_000,
} as const;

/**
 * Create a registry database connection for the resolved driver. Both drivers target the
 * Postgres dialect and share the same schema, so the returned connection is interchangeable for
 * migration and (later) the registry store.
 */
export const createRegistryDbConnection = async ({
  driver,
  connectionString,
  serving,
}: CreateRegistryDbConnectionParams): Promise<RegistryDbConnection> => {
  const limits = serving ? SERVING_POOL_LIMITS : {};
  if (driver === 'neon') {
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    // Neon's serverless driver needs a WebSocket constructor in Node; reuse the bundled `ws`.
    const ws = await import('ws');
    neonConfig.webSocketConstructor = (ws as any).default ?? ws;
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { migrate } = await import('drizzle-orm/neon-serverless/migrator');

    const pool = new Pool({ connectionString, ...limits });
    try {
      await pool.query('select 1');
    } catch (error) {
      await pool.end().catch(() => undefined);
      throw error;
    }
    const db = drizzle(pool, { schema });

    return {
      driver,
      db,
      migrate: (migrationsFolder: string) => migrate(db, { migrationsFolder }),
      close: () => pool.end(),
    };
  }

  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');

  const pool = new Pool({ connectionString, ...limits });
  try {
    await pool.query('select 1');
  } catch (error) {
    await pool.end().catch(() => undefined);
    throw error;
  }
  const db = drizzle(pool, { schema });

  return {
    driver,
    db,
    migrate: (migrationsFolder: string) => migrate(db, { migrationsFolder }),
    close: () => pool.end(),
  };
};
