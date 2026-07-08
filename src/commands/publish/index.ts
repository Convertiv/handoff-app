import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

/** Entity kinds publishable from a connected workspace. */
const ENTITY_KINDS = ['component', 'pattern', 'page', 'tokens', 'assets'] as const;

/** Entity kinds that require an explicit id (tokens/assets support a bulk publish, so id is optional there). */
const ID_REQUIRED_KINDS = ['component', 'pattern', 'page'] as const;

export interface PublishArgs extends SharedArgs {
  type: (typeof ENTITY_KINDS)[number];
  id?: string;
}

/**
 * `handoff-app publish <component|pattern|page> <id>` — fresh targeted local build + upload of the
 * selected entity to the connected registry.
 *
 * `handoff-app publish tokens [setId]` — fresh token build + upload of every logical token set, or
 * only the named set (`foundation/colors`, `component/button`).
 *
 * `handoff-app publish assets [collection]` runs a fresh build and uploads every asset collection, or
 * only the named one (`icons`, `logos`, `fonts`). Available only from a connected workspace
 * (`runtime.mode: workspace` + a configured `registryConnection`).
 */
const command: CommandModule<{}, PublishArgs> = {
  command: 'publish <type> [id]',
  describe: 'Build and publish a component, pattern, page, design tokens, or assets to the connected registry',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: 'The kind of entity to publish',
        choices: ENTITY_KINDS,
        type: 'string',
      })
      .positional('id', {
        describe: 'The stable id of the entity (component/pattern/page id, token set id, or asset collection); optional for tokens/assets',
        type: 'string',
      });
  },
  handler: async (args: PublishArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    try {
      if (args.type === 'tokens') {
        await handoff.publishTokens(args.id);
        return;
      }
      if (args.type === 'assets') {
        await handoff.publishAssets(args.id);
        return;
      }
      if (!args.id) {
        throw new Error(`An id is required to publish a ${args.type} (e.g. "handoff-app publish ${args.type} <id>").`);
      }
      await handoff.publish(args.type, args.id);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
