import { CommandModule } from 'yargs';
import { ASSET_COLLECTIONS } from '../../registry/assets/sets';
import {
  hiddenOptions,
  UNSUPPORTED_PUSH_ALL_OPTIONS,
  UNSUPPORTED_PUSH_OPTIONS,
  UNSUPPORTED_PUSH_TOKENS_OPTIONS,
  warnDeprecatedCommand,
  warnUnsupportedOptions,
} from '../compat/deprecations';
import {
  type CompatAssetSkipArgs,
  type CompatSkipArgs,
  type CompatTargetArgs,
  resolveCompatAllKinds,
  resolveCompatAssetSelection,
  resolveCompatTargets,
} from '../compat/push-args';
import { SharedArgs } from '../types';
import { getPublishOptions, runRegistryCommand, withTargetPositionals } from '../utils';

/**
 * Deprecated `push` family: the command names used by the published docs, kept working over the
 * canonical `publish` implementation.
 *
 * Each command translates its documented arguments through `commands/compat` and then calls the same
 * `Handoff` entry point `publish` uses, so there is no second publish path to keep in step. Options
 * the docs describe for subsystems we do not have are declared hidden and warned about, so a command
 * copied from the docs runs and explains itself rather than failing on an unknown argument.
 */

export interface PushArgs extends SharedArgs, CompatTargetArgs {}
export interface PushAllArgs extends SharedArgs, CompatSkipArgs {}
export interface PushTokensArgs extends SharedArgs {
  setId?: string[];
}
export interface PushAssetsArgs extends SharedArgs, CompatAssetSkipArgs {
  collection?: string;
}

const push: CommandModule<{}, PushArgs> = {
  command: 'push [type] [id..]',
  describe: 'Deprecated alias for publish',
  deprecated: true,
  builder: (yargs) =>
    withTargetPositionals(getPublishOptions(yargs), 'publish').options({
      components: { type: 'array', string: true, description: 'Publish only these component ids' },
      patterns: { type: 'array', string: true, description: 'Publish only these pattern ids' },
      pages: { type: 'array', string: true, description: 'Publish only these page slugs' },
      ...hiddenOptions(UNSUPPORTED_PUSH_OPTIONS),
    }),
  handler: (args: PushArgs) =>
    runRegistryCommand(args, (handoff) => {
      warnDeprecatedCommand('push', 'publish');
      warnUnsupportedOptions(args, UNSUPPORTED_PUSH_OPTIONS);
      return handoff.publishAll(resolveCompatTargets(args));
    }),
};

const pushAll: CommandModule<{}, PushAllArgs> = {
  command: 'push:all',
  describe: 'Deprecated alias for publish all',
  deprecated: true,
  builder: (yargs) =>
    getPublishOptions(yargs).options({
      'skip-tokens': { type: 'boolean', description: 'Skip the token step' },
      'skip-assets': { type: 'boolean', description: 'Skip the asset step' },
      'skip-components': { type: 'boolean', description: 'Skip the component step' },
      'skip-patterns': { type: 'boolean', description: 'Skip the pattern step' },
      'skip-pages': { type: 'boolean', description: 'Skip the page step' },
      ...hiddenOptions(UNSUPPORTED_PUSH_ALL_OPTIONS),
    }),
  handler: (args: PushAllArgs) =>
    runRegistryCommand(args, (handoff) => {
      warnDeprecatedCommand('push:all', 'publish all');
      warnUnsupportedOptions(args, UNSUPPORTED_PUSH_ALL_OPTIONS);
      return handoff.publishAll(resolveCompatAllKinds(args));
    }),
};

const pushTokens: CommandModule<{}, PushTokensArgs> = {
  command: 'push:tokens [setId..]',
  describe: 'Deprecated alias for publish tokens',
  deprecated: true,
  builder: (yargs) =>
    getPublishOptions(yargs)
      .positional('setId', { describe: 'Token set id, e.g. foundation/colors', type: 'string', array: true })
      .options(hiddenOptions(UNSUPPORTED_PUSH_TOKENS_OPTIONS)),
  handler: (args: PushTokensArgs) =>
    runRegistryCommand(args, (handoff) => {
      warnDeprecatedCommand('push:tokens', 'publish tokens');
      warnUnsupportedOptions(args, UNSUPPORTED_PUSH_TOKENS_OPTIONS);
      return handoff.publishTokens(args.setId);
    }),
};

const pushAssets: CommandModule<{}, PushAssetsArgs> = {
  command: 'push:assets [collection]',
  describe: 'Deprecated alias for publish assets',
  deprecated: true,
  builder: (yargs) =>
    getPublishOptions(yargs)
      .positional('collection', { describe: `Asset collection (${ASSET_COLLECTIONS.join(', ')})`, type: 'string' })
      .options({
        'skip-icons': { type: 'boolean', description: 'Skip the icons collection' },
        'skip-logos': { type: 'boolean', description: 'Skip the logos collection' },
      }),
  handler: (args: PushAssetsArgs) =>
    runRegistryCommand(args, (handoff) => {
      warnDeprecatedCommand('push:assets', 'publish assets');
      return handoff.publishAssets(resolveCompatAssetSelection(args, args.collection));
    }),
};

export const pushCommands = [push, pushAll, pushTokens, pushAssets];
