import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

/** Entity kinds publishable from a connected workspace. */
const ENTITY_KINDS = ['component', 'pattern', 'page'] as const;

export interface PublishArgs extends SharedArgs {
  type: (typeof ENTITY_KINDS)[number];
  id: string;
}

/**
 * `handoff-app publish <component|pattern> <id>` — fresh targeted local build + upload of the
 * selected entity to the connected registry. Available only from a connected workspace
 * (`runtime.mode: workspace` + a configured `registryConnection`).
 */
const command: CommandModule<{}, PublishArgs> = {
  command: 'publish <type> <id>',
  describe: 'Build and publish a component, pattern, or page to the connected registry',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: 'The kind of entity to publish',
        choices: ENTITY_KINDS,
        type: 'string',
      })
      .positional('id', {
        describe: 'The stable id of the component, pattern, or page to publish',
        type: 'string',
      });
  },
  handler: async (args: PublishArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    try {
      await handoff.publish(args.type, args.id);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
