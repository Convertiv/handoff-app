import { Argv } from 'yargs';
import Handoff from '../';
import { REGISTRY_ENTITY_KINDS } from '../registry/content-kinds';
import { Logger } from '../utils/logger';
import { SharedArgs } from './types';

/**
 * The `type` argument accepted by publish and checkout, or `all` for every kind. `catalog` covers
 * every catalog item. An item's lane comes from its declaration, so the command line names items and
 * never a lane.
 */
export const REGISTRY_TARGET_KINDS = ['catalog', 'pages', 'tokens', 'assets', 'all'] as const;
export type RegistryTargetKind = (typeof REGISTRY_TARGET_KINDS)[number];

/**
 * The `type` argument accepted by the deprecated `push` / `pull` aliases: the plural content kinds the
 * published docs name. This list keeps `components` and `patterns`, which the canonical commands do
 * not take, and omits `catalog`, which the docs do not describe.
 */
export const COMPAT_TARGET_KINDS = [...REGISTRY_ENTITY_KINDS, 'all'] as const;
export type CompatTargetKind = (typeof COMPAT_TARGET_KINDS)[number];

export const createHandoff = (args: SharedArgs): Handoff =>
  new Handoff({
    debug: args.debug,
    force: args.force,
    configPath: args.config,
    dryRun: args.dryRun,
    // yargs gives `--no-build` as `build: false`; anything else leaves the build in place.
    skipBuild: args.build === false,
  });

/**
 * Run a registry command against a fresh Handoff. Registry failures are the user's to act on, so they
 * surface as one actionable line and a non-zero exit rather than a stack trace.
 */
export const runRegistryCommand = async (args: SharedArgs, run: (handoff: Handoff) => Promise<unknown>): Promise<void> => {
  const handoff = createHandoff(args);
  try {
    await run(handoff);
  } catch (error) {
    Logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

export const getSharedOptions = (yargs: Argv) => {
  return yargs.options({
    config: {
      alias: 'c',
      type: 'string',
      description: 'Path to config file, relative to the working directory',
    },
    force: {
      alias: 'f',
      type: 'boolean',
      description: 'Force action',
    },
    debug: {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug mode',
    },
  });
};

/** Shared options plus the transfer options: publish and its compatibility aliases use these. */
export const getPublishOptions = (yargs: Argv) =>
  getSharedOptions(yargs).options({
    'dry-run': {
      type: 'boolean',
      description: 'Report what would be published without contacting the registry (the build still runs; add --no-build to skip it)',
    },
    build: {
      type: 'boolean',
      default: true,
      description: 'Run a fresh build first; use --no-build to publish the existing output',
    },
  });

/** Shared options plus `--dry-run`: checkout and its compatibility aliases use these. */
export const getCheckoutOptions = (yargs: Argv) =>
  getSharedOptions(yargs).options({
    'dry-run': {
      type: 'boolean',
      description: 'Report what would be written without changing any workspace file',
    },
  });

/**
 * Positional `type` + variadic `id`, shared by publish, checkout, and their compatibility aliases.
 * `choices` is always declared: yargs allows an omitted optional positional while still rejecting an
 * unrecognized one, so the deprecated commands get the same guard as the canonical ones.
 */
export const withTargetPositionals = <TKind extends string>(yargs: Argv, verb: 'publish' | 'checkout', choices: readonly TKind[]) =>
  yargs
    .positional('type', {
      describe: `The kind of content to ${verb}, or "all" for every kind`,
      choices,
      type: 'string',
    })
    .positional('id', {
      describe: `The stable id (catalog item id, page id, token set id, or asset collection); omit to ${verb} all of that kind`,
      type: 'string',
      array: true,
    });

/** Dispatch one `type` argument to the matching Handoff entry point. */
export const runTarget = (handoff: Handoff, type: RegistryTargetKind, ids: string[] | undefined, verb: 'publish' | 'checkout') => {
  if (type === 'all') {
    return verb === 'publish' ? handoff.publishAll() : handoff.checkoutAll();
  }
  if (type === 'catalog') {
    return verb === 'publish' ? handoff.publishCatalog(ids) : handoff.checkoutCatalog(ids);
  }
  return verb === 'publish' ? handoff.publishKind(type, ids) : handoff.checkoutKind(type, ids);
};
