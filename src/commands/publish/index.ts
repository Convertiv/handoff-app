import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { ENTITY_WIRE_KIND, getSharedOptions, REGISTRY_ENTITY_KINDS, RegistryEntityKind } from '../utils';

export interface PublishArgs extends SharedArgs {
  type: RegistryEntityKind;
  id?: string;
}

/**
 * `handoff-app publish <components|patterns|pages> [id]` runs a fresh local build and uploads to the
 * connected registry. Pass an `id` to build and upload that one entity, or omit it to build the kind
 * once and upload every declared entity, skipping any whose content already matches the registry
 * (pass `--force` to re-upload everything).
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
  describe: 'Build and publish components, patterns, pages, design tokens, or assets to the connected registry',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: 'The kind of entity to publish',
        choices: REGISTRY_ENTITY_KINDS,
        type: 'string',
      })
      .positional('id', {
        describe: 'The stable id of the entity (component/pattern/page id, token set id, or asset collection); omit to publish all of that kind',
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
      await handoff.publish(ENTITY_WIRE_KIND[args.type], args.id);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
