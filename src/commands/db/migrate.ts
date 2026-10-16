import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface DbMigrateArgs extends SharedArgs {}

/**
 * `handoff-app db:migrate` — runs the package-owned registry database migrations against the
 * configured PostgreSQL/Neon database. Reads the consuming project's config + DB env vars and runs
 * independently of `build`.
 */
const command: CommandModule<{}, DbMigrateArgs> = {
  command: 'db:migrate',
  describe: 'Run registry database migrations (Drizzle / PostgreSQL)',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: DbMigrateArgs) => {
    const handoff = createHandoff(args);
    await handoff.dbMigrate();
  },
};

export default command;
