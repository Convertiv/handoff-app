import { CommandModule } from 'yargs';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, ENTITY_WIRE_KIND, getSharedOptions, REGISTRY_ENTITY_KINDS, RegistryEntityKind } from '../utils';

export interface CheckoutArgs extends SharedArgs {
  type: RegistryEntityKind;
  id?: string;
}

/**
 * `handoff-app checkout <components|patterns|pages> [id]` pulls entities from the connected registry
 * into this workspace, writing their source files in standard authoring form and synthesizing local
 * declarations. Pass an `id` to pull that one entity, or omit it to pull every published entity of
 * that kind.
 *
 * `handoff-app checkout tokens [setId]` — pull every published token set (or only the named set) into
 * this workspace: reconstruct `tokens.json` and restore the generated token files.
 *
 * `handoff-app checkout assets [collection]` pulls every published asset collection (or only the
 * named one) into this workspace, recreating the standard asset files, sprite/manifest, and archives.
 * Available only from a connected workspace (`runtime.mode: workspace` + a configured
 * `registryConnection`). Overwriting existing local files requires `--force` or an interactive
 * confirmation.
 */
const command: CommandModule<{}, CheckoutArgs> = {
  command: 'checkout <type> [id]',
  describe: 'Pull components, patterns, pages, design tokens, or assets from the connected registry into this workspace',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: 'The kind of entity to checkout',
        choices: REGISTRY_ENTITY_KINDS,
        type: 'string',
      })
      .positional('id', {
        describe: 'The stable id of the entity (component/pattern/page id, token set id, or asset collection); omit to checkout all of that kind',
        type: 'string',
      });
  },
  handler: async (args: CheckoutArgs) => {
    const handoff = createHandoff(args);
    try {
      if (args.type === 'tokens') {
        await handoff.checkoutTokens(args.id);
        return;
      }
      if (args.type === 'assets') {
        await handoff.checkoutAssets(args.id);
        return;
      }
      await handoff.checkout(ENTITY_WIRE_KIND[args.type], args.id);
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
