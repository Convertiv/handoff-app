/**
 * Standalone bundle entry for the self-contained registry migration runner (issue #11).
 *
 * The deployed registry artifact has no `handoff-app` CLI, workspace, or project config on the deploy
 * host, so `handoff-app db:migrate` (the workspace-side runner in `./migrate.ts`) cannot run there.
 * The registry build bundles this entry into a single `migrate.cjs` (the Drizzle client is inlined;
 * the selected Postgres/Neon driver is resolved at runtime from the artifact's `node_modules`) and
 * ships the package-owned `drizzle/` migrations next to it, so an operator can apply migrations from
 * the artifact itself:
 *
 *   DATABASE_URL="postgres://…" node migrate.cjs
 *
 * Adapter and the DB env-var *name* are baked at build time (via esbuild `define`, mirroring the app
 * bundle); the connection-string *value* is read from that env var at runtime, never baked.
 */

import path from 'path';
import { DEFAULT_DATABASE_URL_ENV, DEFAULT_REGISTRY_ADAPTER, type RegistryDatabaseAdapter } from './adapter';
import { createRegistryDbConnection } from './client';

/** Resolve the adapter baked at build time (defaults to the package default). */
const resolveAdapter = (): RegistryDatabaseAdapter =>
  process.env.HANDOFF_REGISTRY_ADAPTER === 'neon' ? 'neon' : DEFAULT_REGISTRY_ADAPTER;

/** Resolve the env-var *name* holding the connection string (baked at build, default `DATABASE_URL`). */
const resolveDatabaseUrlEnv = (): string => process.env.HANDOFF_REGISTRY_DATABASE_URL_ENV?.trim() || DEFAULT_DATABASE_URL_ENV;

const run = async (): Promise<void> => {
  const adapter = resolveAdapter();
  const databaseUrlEnv = resolveDatabaseUrlEnv();
  const connectionString = process.env[databaseUrlEnv]?.trim();

  if (!connectionString) {
    throw new Error(
      `Registry database URL is not configured. Set the "${databaseUrlEnv}" environment variable to a ` +
        'PostgreSQL connection string before running the migrations.'
    );
  }

  // The package-owned migrations are shipped beside this script (`./drizzle`) by the registry build.
  const migrationsFolder = path.join(__dirname, 'drizzle');

  // eslint-disable-next-line no-console
  console.log(`Running registry migrations (adapter: "${adapter}", database url from "${databaseUrlEnv}").`);

  const connection = await createRegistryDbConnection({ adapter, connectionString });
  try {
    await connection.migrate(migrationsFolder);
    // eslint-disable-next-line no-console
    console.log('Registry migrations applied successfully.');
  } finally {
    await connection.close();
  }
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
