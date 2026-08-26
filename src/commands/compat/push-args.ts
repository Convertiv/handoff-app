/**
 * Translation from the documented `push` / `pull` argument shape to canonical publish targets.
 *
 * The published CLI reference addresses content with selective flags (`--components <ids>`) and an
 * implied "everything" default, while we address it positionally (`publish <type> [id...]`). These
 * are pure functions that convert one into the other; the publishing itself is done by
 * {@link Handoff.publishAll}, so no orchestration lives here.
 */

import { ASSET_COLLECTIONS, type AssetCollection } from '../../registry/assets/sets';
import { ALL_KIND_ORDER, ENTITY_KIND_ORDER, type RegistryEntityKind } from '../../registry/content-kinds';
import type { RegistryTargetKind } from '../utils';
import type { ContentTarget } from '../../index';
import { Logger } from '../../utils/logger';

/** The documented `push` / `pull` arguments read here. */
export interface CompatTargetArgs {
  type?: RegistryTargetKind;
  id?: string[];
  components?: string[];
  patterns?: string[];
  pages?: string[];
}

/** The documented `push:all` skip flags that map onto a real content kind. */
export interface CompatSkipArgs {
  skipTokens?: boolean;
  skipAssets?: boolean;
  skipComponents?: boolean;
  skipPatterns?: boolean;
  skipPages?: boolean;
}

/** The documented `push:assets` skip flags. */
export interface CompatAssetSkipArgs {
  skipIcons?: boolean;
  skipLogos?: boolean;
}

/** Selective flag → the kind it narrows. Ordered so a mixed request still runs in dependency order. */
const SELECTIVE_FLAGS: readonly { flag: keyof CompatTargetArgs; kind: RegistryEntityKind }[] = [
  { flag: 'components', kind: 'components' },
  { flag: 'patterns', kind: 'patterns' },
  { flag: 'pages', kind: 'pages' },
];

/** Skip flag → the kind it removes. */
const SKIP_FLAGS: Readonly<Record<RegistryEntityKind, keyof CompatSkipArgs>> = {
  tokens: 'skipTokens',
  assets: 'skipAssets',
  components: 'skipComponents',
  patterns: 'skipPatterns',
  pages: 'skipPages',
};

/**
 * Resolve what a documented `push` / `pull` invocation targets, in precedence order:
 *
 * 1. selective flags (`--components a b --pages intro`), the documented way to narrow a run;
 * 2. a positional kind, matching our own `publish <type> [id...]`;
 * 3. nothing, which the docs define as pages plus component and pattern declarations.
 */
export const resolveCompatTargets = (args: CompatTargetArgs): ContentTarget[] => {
  const selective = SELECTIVE_FLAGS.filter(({ flag }) => (args[flag] as string[] | undefined)?.length).map(({ flag, kind }) => ({
    kind,
    ids: args[flag] as string[],
  }));

  if (selective.length > 0) {
    if (args.type) {
      Logger.warn(`Ignoring the "${args.type}" argument because selective flags were also given.`);
    }
    return selective;
  }

  // `all` is the canonical every-kind form; expand it here so `push all` behaves like `publish all`.
  if (args.type === 'all') {
    return [...ALL_KIND_ORDER];
  }

  if (args.type) {
    return [{ kind: args.type, ids: args.id?.length ? args.id : undefined }];
  }

  return [...ENTITY_KIND_ORDER];
};

/** Resolve the kinds a documented `push:all` should run, honoring its `--skip-<kind>` flags. */
export const resolveCompatAllKinds = (args: CompatSkipArgs): RegistryEntityKind[] =>
  ALL_KIND_ORDER.filter((kind) => !args[SKIP_FLAGS[kind]]);

/**
 * Resolve the asset collections a documented `push:assets` should publish. Returns `undefined` when
 * nothing is skipped, so the canonical path still discovers collections itself instead of being
 * pinned to the compile-time list.
 */
export const resolveCompatAssetSelection = (
  args: CompatAssetSkipArgs,
  collection?: string
): string[] | undefined => {
  if (collection) {
    return [collection];
  }
  const skipped = new Set<AssetCollection>([...(args.skipIcons ? (['icons'] as const) : []), ...(args.skipLogos ? (['logos'] as const) : [])]);
  return skipped.size > 0 ? ASSET_COLLECTIONS.filter((name) => !skipped.has(name)) : undefined;
};
