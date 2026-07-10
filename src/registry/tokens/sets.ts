/**
 * Logical token-set derivation — the pure, dependency-light boundary between the generated token
 * document and the registry token entity.
 *
 * A **logical token set** is the registry entity boundary for tokens. Its stable ids are:
 *
 * ```text
 * foundation/colors
 * foundation/typography
 * foundation/effects
 * component/<componentId>
 * ```
 *
 * The set `record` is the exact slice extracted from the generated `tokens.json`
 * ({@link CoreTypes.IDocumentationObject}) — no lossy normalization, so new token properties flow
 * through without a database migration. This module is imported by the store, publish, checkout, and
 * server ingestion, so it stays free of fs/DB/React dependencies.
 */

import type { Types as CoreTypes } from 'handoff-core';
import { isSafePathSegment } from '../path';

/** Kind of a logical token set. */
export type TokenSetKind = 'foundation' | 'component';

/** A logical token set: its stable id, kind, and the exact extracted token slice. */
export interface DerivedTokenSet {
  id: string;
  kind: TokenSetKind;
  /** The exact slice from `tokens.json` — `IColorObject[]`/`ITypographyObject[]`/`IEffectObject[]` for a foundation, `IFileComponentObject` for a component. */
  record: unknown;
}

/** The three stable foundation set ids, in deterministic order. */
export const FOUNDATION_SET_IDS = ['foundation/colors', 'foundation/typography', 'foundation/effects'] as const;

/**
 * Map a foundation set name (the segment after `foundation/`, and the generated-file base name) to
 * its `localStyles` key. Note the plural set names (`colors`/`effects`) map to the core's singular
 * `localStyles.color`/`localStyles.effect`.
 */
const LOCAL_STYLES_KEY_BY_FOUNDATION: Record<string, keyof CoreTypes.IDocumentationObject['localStyles']> = {
  colors: 'color',
  typography: 'typography',
  effects: 'effect',
};

/** Whether a set id refers to a component token set. */
export const isComponentSet = (id: string): boolean => id.startsWith('component/');

export const isTokenSetId = (id: string): boolean => {
  if ((FOUNDATION_SET_IDS as readonly string[]).includes(id)) {
    return true;
  }
  return isComponentSet(id) && isSafePathSegment(id.slice('component/'.length));
};

/** The kind of a set id. */
export const kindForSetId = (id: string): TokenSetKind => (isComponentSet(id) ? 'component' : 'foundation');

/**
 * The generated-file base name for a set: `colors`/`typography`/`effects` for a foundation, the
 * component id for a component set. This is the name the style transformers write files under
 * (`<outDir>/<name>.<format>`).
 */
export const setNameForId = (id: string): string => (isComponentSet(id) ? id.slice('component/'.length) : (id.split('/')[1] ?? id));

/** The `foundations/<type>` page type (`colors`/`typography`/`effects`) for a foundation set id, else null. */
export const foundationTypeForId = (id: string): string | null => (isComponentSet(id) ? null : (id.split('/')[1] ?? null));

/**
 * Split the generated token document into logical sets: the three foundation sets (each possibly an
 * empty array) plus one set per component. Foundation sets are always emitted so a set can carry zero
 * tokens and so a token removed from a set is reflected as a shrunk `record` on republish.
 */
export const deriveTokenSets = (doc: CoreTypes.IDocumentationObject | null | undefined): DerivedTokenSet[] => {
  const localStyles = doc?.localStyles ?? ({} as CoreTypes.IDocumentationObject['localStyles']);
  const sets: DerivedTokenSet[] = [
    { id: 'foundation/colors', kind: 'foundation', record: localStyles.color ?? [] },
    { id: 'foundation/typography', kind: 'foundation', record: localStyles.typography ?? [] },
    { id: 'foundation/effects', kind: 'foundation', record: localStyles.effect ?? [] },
  ];

  const components = doc?.components ?? {};
  for (const componentId of Object.keys(components)) {
    sets.push({ id: `component/${componentId}`, kind: 'component', record: components[componentId] });
  }

  return sets;
};

/** A minimal default token document, used when no local `tokens.json` exists yet on checkout. */
export const emptyTokenDocument = (): CoreTypes.IDocumentationObject =>
  ({
    localStyles: { color: [], typography: [], effect: [] },
    components: {},
    assets: {},
  }) as CoreTypes.IDocumentationObject;

/**
 * Splice a set of logical token sets into a token document, returning the merged document. Untouched
 * sets are preserved (single-set checkout never clobbers other sets); a foundation set replaces its
 * `localStyles` slice, a component set replaces `components[<id>]`.
 */
export const mergeTokenSetsIntoDocument = (
  existing: CoreTypes.IDocumentationObject | null | undefined,
  sets: DerivedTokenSet[]
): CoreTypes.IDocumentationObject => {
  const base = existing ?? emptyTokenDocument();
  const doc: CoreTypes.IDocumentationObject = {
    ...base,
    localStyles: { ...(base.localStyles ?? emptyTokenDocument().localStyles) },
    components: { ...(base.components ?? {}) },
  } as CoreTypes.IDocumentationObject;

  for (const set of sets) {
    if (isComponentSet(set.id)) {
      doc.components[setNameForId(set.id)] = set.record as CoreTypes.IFileComponentObject;
      continue;
    }
    const localStylesKey = LOCAL_STYLES_KEY_BY_FOUNDATION[setNameForId(set.id)];
    if (localStylesKey) {
      (doc.localStyles as Record<string, unknown>)[localStylesKey] = set.record;
    }
  }

  return doc;
};

/** The `localStyles` key backing a `foundations/<type>` page (`colors`→`color`, `effects`→`effect`). */
export const localStylesKeyForFoundationType = (type: string): keyof CoreTypes.IDocumentationObject['localStyles'] | null =>
  LOCAL_STYLES_KEY_BY_FOUNDATION[type] ?? null;
