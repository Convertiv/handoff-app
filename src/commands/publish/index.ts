import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { getPublishOptions, RegistryTargetKind, runRegistryCommand, runTarget, withTargetPositionals } from '../utils';

export interface PublishArgs extends SharedArgs {
  type: RegistryTargetKind;
  id?: string[];
}

/**
 * `handoff-app publish <components|patterns|pages> [id...]` runs a fresh local build and uploads to
 * the connected registry. Pass ids to build and upload only those entities, or omit them to build the
 * kind once and upload every declared entity, skipping any whose content already matches the registry
 * (`--force` re-uploads everything).
 *
 * `handoff-app publish tokens [setId...]` does a fresh token build and uploads every logical token
 * set, or only the named ones (`foundation/colors`, `component/button`).
 *
 * `handoff-app publish assets [collection...]` runs a fresh build and uploads every asset collection,
 * or only the named ones (`icons`, `logos`, `fonts`).
 *
 * `handoff-app publish all` runs every kind in dependency order: tokens, assets, components,
 * patterns, then pages.
 *
 * Available only from a connected workspace (`runtime.mode: workspace` + a configured
 * `registryConnection`), except under `--dry-run`, which reports what would be uploaded and needs no
 * registry at all.
 */
const command: CommandModule<{}, PublishArgs> = {
  command: 'publish <type> [id..]',
  describe: 'Build and publish components, patterns, pages, design tokens, or assets to the connected registry',
  builder: (yargs) => withTargetPositionals(getPublishOptions(yargs), 'publish'),
  handler: (args: PublishArgs) => runRegistryCommand(args, (handoff) => runTarget(handoff, args.type, args.id, 'publish')),
};

export default command;
