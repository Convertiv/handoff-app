import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

/** Entity kinds checkout-able from a connected workspace. */
const ENTITY_KINDS = ['component', 'pattern', 'page'] as const;

export interface CheckoutArgs extends SharedArgs {
  type: (typeof ENTITY_KINDS)[number];
  id: string;
}

/**
 * `handoff-app checkout <component|pattern> <id>` — pull an entity from the connected registry into
 * this workspace: writes its source files in standard authoring form and synthesizes a local
 * declaration. Available only from a connected workspace (`runtime.mode: workspace` + a configured
 * `registryConnection`). Overwriting existing local files requires `--force` or an interactive
 * confirmation.
 */
const command: CommandModule<{}, CheckoutArgs> = {
  command: 'checkout <type> <id>',
  describe: 'Pull a component, pattern, or page from the connected registry into this workspace',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: 'The kind of entity to checkout',
        choices: ENTITY_KINDS,
        type: 'string',
      })
      .positional('id', {
        describe: 'The stable id of the component, pattern, or page to checkout',
        type: 'string',
      });
  },
  handler: async (args: CheckoutArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    try {
      await handoff.checkout(args.type, args.id);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
