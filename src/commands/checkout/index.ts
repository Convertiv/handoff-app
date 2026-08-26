import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { getCheckoutOptions, RegistryTargetKind, runRegistryCommand, runTarget, withTargetPositionals } from '../utils';

export interface CheckoutArgs extends SharedArgs {
  type: RegistryTargetKind;
  id?: string[];
}

/**
 * `handoff-app checkout <components|patterns|pages> [id...]` pulls entities from the connected
 * registry into this workspace, writing their source files in standard authoring form and
 * synthesizing local declarations. Pass ids to pull only those entities, or omit them for every
 * published entity of that kind.
 *
 * `handoff-app checkout tokens [setId...]` pulls every published token set, or only the named ones,
 * reconstructing `tokens.json` and restoring the generated token files.
 *
 * `handoff-app checkout assets [collection...]` pulls every published asset collection, or only the
 * named ones, recreating the standard asset files, sprite/manifest and archives.
 *
 * `handoff-app checkout all` runs every kind in the same order publish uses.
 *
 * Available only from a connected workspace (`runtime.mode: workspace` + a configured
 * `registryConnection`). Overwriting existing local files requires `--force` or an interactive
 * confirmation; `--dry-run` lists what would be written and changes nothing.
 */
const command: CommandModule<{}, CheckoutArgs> = {
  command: 'checkout <type> [id..]',
  describe: 'Pull components, patterns, pages, design tokens, or assets from the connected registry into this workspace',
  builder: (yargs) => withTargetPositionals(getCheckoutOptions(yargs), 'checkout'),
  handler: (args: CheckoutArgs) => runRegistryCommand(args, (handoff) => runTarget(handoff, args.type, args.id, 'checkout')),
};

export default command;
