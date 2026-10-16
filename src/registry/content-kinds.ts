/**
 * Logical content-kind vocabulary: the dependency-light boundary shared by the CLI, the
 * publish/checkout orchestration, and the compatibility layer.
 *
 * A workspace publishes and checks out five kinds of content. Components, patterns and pages are
 * entities with a singular wire kind ({@link TransferEntityKind}); tokens and assets travel through
 * their own transfer endpoints. This module owns only the stable plural vocabulary and its ordering,
 * so it stays free of fs, DB and React dependencies.
 */

import type { TransferEntityKind } from './transfer';

/** Stable identity used to publish `pages/index.md` while serving it at the root route. */
export const HOME_PAGE_ID = 'index';
export const HOME_PAGE_PATH = '/';

/** Plural content kinds accepted wherever a publish or checkout target is named. */
export const REGISTRY_ENTITY_KINDS = ['components', 'patterns', 'pages', 'tokens', 'assets'] as const;
export type RegistryEntityKind = (typeof REGISTRY_ENTITY_KINDS)[number];

/** Map the plural content kind to the singular wire kind used by entity publish/checkout. */
export const ENTITY_WIRE_KIND: Record<'components' | 'patterns' | 'pages', TransferEntityKind> = {
  components: 'component',
  patterns: 'pattern',
  pages: 'page',
};

/** The entity kinds, in the order a full run visits them: patterns compose components, pages reference both. */
export const ENTITY_KIND_ORDER = ['components', 'patterns', 'pages'] as const;

/**
 * Every kind, in dependency order. Tokens and assets come first because rendered component
 * artifacts reference the CSS variables and asset URLs they produce.
 */
export const ALL_KIND_ORDER: readonly RegistryEntityKind[] = ['tokens', 'assets', ...ENTITY_KIND_ORDER];

/** Whether a string names a supported content kind. */
export const isRegistryEntityKind = (value: string): value is RegistryEntityKind =>
  (REGISTRY_ENTITY_KINDS as readonly string[]).includes(value);
