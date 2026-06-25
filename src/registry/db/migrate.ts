/**
 * Registry migration runner.
 *
 * `handoff-app db:migrate` reads the consuming project's config + DB env vars, resolves the same
 * `runtime.registry.database.adapter` used at runtime/build, and applies the package-owned
 * migration set with the bundled Drizzle migrator. Migrations are resolved relative to the
 * installed package (not the consuming project), so the schema is versioned with the tool. This
 * runs independently of `build`.
 */

import fs from 'fs-extra';
import path from 'path';
import type Handoff from '../../';
import { Logger } from '../../utils/logger';
import { resolveRegistryDatabase } from './adapter';
import { createRegistryDbConnection } from './client';

/**
 * Absolute path to the package-owned migrations folder. Resolved relative to the installed
 * `handoff-app` package root (`<package>/drizzle`) via {@link Handoff.modulePath} so it is
 * independent of the consuming project's working directory.
 */
export const getMigrationsFolder = (handoff: Handoff): string => path.resolve(handoff.modulePath, 'drizzle');

/**
 * Run the package-owned registry migrations against the configured database.
 *
 * @throws when Handoff is uninitialized, the database URL env var is unset, or the packaged
 *   migrations are missing — each with an actionable message.
 */
export const runRegistryMigrations = async (handoff: Handoff): Promise<void> => {
  if (!handoff.config) {
    throw new Error('Handoff is not initialized; cannot resolve registry database configuration.');
  }

  const { adapter, databaseUrlEnv, connectionString } = resolveRegistryDatabase(handoff.config);

  const migrationsFolder = getMigrationsFolder(handoff);
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
  if (!fs.existsSync(journalPath)) {
    throw new Error(
      `Packaged registry migrations were not found at "${migrationsFolder}". This indicates a broken ` +
        `handoff-app installation — reinstall the package to restore the bundled migration set.`
    );
  }

  Logger.info(`Running registry migrations (adapter: "${adapter}", database url from "${databaseUrlEnv}").`);

  const connection = await createRegistryDbConnection({ adapter, connectionString });
  try {
    await connection.migrate(migrationsFolder);
    Logger.success('Registry migrations applied successfully.');
  } finally {
    await connection.close();
  }
};
