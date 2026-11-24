import { toArgsSchema, type ComponentContract as CoreContract } from '../custom-previews/contract';
import { assessComponentArgs } from './instances';
import type { ComponentInfo, ComponentQuery, ComponentSummary, PatternInfo, PatternQuery } from './types';

/**
 * The screen view of the design system: docs records as `ComponentSummary`, `ComponentInfo` and
 * `PatternInfo`, and the queries over them. Pure, so the browser hooks and the server docs reader
 * read and query alike. A new query option is added here once.
 */

/** The component record fields screens read: an entry of the components list, or the component JSON the build writes. */
export interface ComponentArtifactShape {
  id: string;
  title?: string;
  description?: string;
  group?: string;
  type?: string;
  categories?: string[];
  tags?: string[];
  image?: string;
  renderer?: string;
  properties?: CoreContract;
  previews?: Record<string, { title?: string; values?: Record<string, unknown>; url?: string }>;
  customPreview?: { renderUrl?: string };
}

/** The pattern fields `toPatternInfo` reads: a pattern record of the docs read API. */
export interface PatternRecordShape {
  id: string;
  title?: string;
  description?: string;
  group?: string;
  components?: { id: string; preview?: string; args?: Record<string, unknown> }[];
}

export const toComponentSummary = (record: ComponentArtifactShape): ComponentSummary => ({
  id: record.id,
  title: record.title || record.id,
  description: record.description || undefined,
  group: record.group || undefined,
  type: record.type || undefined,
  categories: record.categories?.length ? record.categories : undefined,
  tags: record.tags?.length ? record.tags : undefined,
  image: record.image || undefined,
  renderer: record.renderer || undefined,
});

/** The screen view of a built component. */
export const toComponentInfo = (artifact: ComponentArtifactShape): ComponentInfo => {
  const contract = artifact.properties ?? {};
  const previews = Object.entries(artifact.previews ?? {}).map(([key, preview]) => ({
    key,
    title: preview.title ?? key,
    args: (preview.values ?? {}) as Record<string, unknown>,
  }));
  return {
    ...toComponentSummary(artifact),
    contract,
    argsSchema: toArgsSchema(contract),
    defaultArgs: assessComponentArgs(contract, structuredClone(previews[0]?.args ?? {})).args,
    previews,
    renderable: Boolean(artifact.customPreview?.renderUrl),
  };
};

/**
 * The screen view of a pattern. An entry that names a preview instead of args takes that preview's
 * args, so the expanded instances render like the pattern does.
 */
export const toPatternInfo = (pattern: PatternRecordShape, components: ReadonlyMap<string, ComponentInfo | null>): PatternInfo => ({
  id: pattern.id,
  title: pattern.title || pattern.id,
  description: pattern.description || undefined,
  group: pattern.group || undefined,
  components: (pattern.components ?? []).map((entry) => {
    const info = components.get(entry.id);
    const preview = info?.previews.find((candidate) => candidate.key === entry.preview) ?? info?.previews[0];
    return { componentId: entry.id, args: { ...(preview?.args ?? {}), ...(entry.args ?? {}) } };
  }),
});

/** Patterns with their component args resolved. `loadComponent` reads one component; it may cache. */
export const resolvePatterns = async (
  records: PatternRecordShape[],
  loadComponent: (id: string) => Promise<ComponentInfo | null>
): Promise<PatternInfo[]> => {
  const ids = [...new Set(records.flatMap((pattern) => (pattern.components ?? []).map((entry) => entry.id)))];
  const components = new Map(await Promise.all(ids.map(async (id) => [id, await loadComponent(id).catch(() => null)] as const)));
  return records.map((pattern) => toPatternInfo(pattern, components));
};

/** The result of a component or pattern query. */
export interface QueryResult<T> {
  /** The items that pass `filter` and match `search`. */
  items: T[];
  /** The groups of the items that pass `filter`, sorted. `search` does not change them. */
  groups: string[];
}

const groupsOf = (items: { group?: string }[]): string[] =>
  [...new Set(items.map((item) => item.group).filter((group): group is string => Boolean(group)))].sort();

const runQuery = <T extends { group?: string }>(
  all: T[],
  query: { search?: string; filter?(item: T): boolean },
  searchText: (item: T) => (string | undefined)[]
): QueryResult<T> => {
  const scoped = query.filter ? all.filter((item) => query.filter!(item)) : all;
  const needle = query.search?.trim().toLowerCase();
  const items = needle ? scoped.filter((item) => searchText(item).some((value) => value?.toLowerCase().includes(needle))) : scoped;
  return { items, groups: groupsOf(scoped) };
};

/** Components that pass `filter` and match `search`. Search reads the id, title, description, group, categories and tags. */
export const queryComponents = (all: ComponentSummary[], query: ComponentQuery = {}): QueryResult<ComponentSummary> =>
  runQuery(all, query, (component) => [
    component.id,
    component.title,
    component.description,
    component.group,
    ...(component.categories ?? []),
    ...(component.tags ?? []),
  ]);

/** Patterns that pass `filter` and match `search`. Search reads the id, title, description and group. */
export const queryPatterns = (all: PatternInfo[], query: PatternQuery = {}): QueryResult<PatternInfo> =>
  runQuery(all, query, (pattern) => [pattern.id, pattern.title, pattern.description, pattern.group]);
