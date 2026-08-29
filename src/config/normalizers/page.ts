import { PageListObject } from '../../transformers/preview/types';

type RawPageFrontmatter = Record<string, any>;

type NormalizePageOptions = {
  /** The page id derived from its file location (`index` is reserved for the root home page). */
  id: string;
  /** Logical route the page is served at (e.g. `/guides/setup`). */
  routePath: string;
  /** Absolute filesystem path of the source `.md` (workspace-only, stripped on publish). */
  sourcePath: string;
};

/** Humanize a slug segment (`getting-started` → `Getting Started`) for a default title. */
const humanize = (segment: string): string =>
  segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/**
 * Normalize a page's parsed markdown frontmatter into a {@link PageListObject}. Pages have no
 * required authored fields (a bare `.md` is valid); the title falls back to a humanized last slug
 * segment. The file location is the source of identity for filesystem and registry serving. Normal
 * page ids match their routes; the reserved `index` id is served at `/`.
 */
export const normalizePageDeclaration = (raw: RawPageFrontmatter, options: NormalizePageOptions): PageListObject => {
  const lastSegment = options.id.split('/').pop() ?? options.id;

  return {
    id: options.id,
    path: options.routePath,
    sourcePath: options.sourcePath,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : humanize(lastSegment),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    group: typeof raw.group === 'string' ? raw.group : undefined,
    weight: typeof raw.weight === 'number' ? raw.weight : undefined,
    menuTitle: typeof raw.menuTitle === 'string' ? raw.menuTitle : undefined,
    metaTitle: typeof raw.metaTitle === 'string' ? raw.metaTitle : undefined,
    metaDescription: typeof raw.metaDescription === 'string' ? raw.metaDescription : undefined,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : undefined,
    external: typeof raw.external === 'string' || typeof raw.external === 'boolean' ? raw.external : undefined,
    menu: raw.menu && typeof raw.menu === 'object' ? raw.menu : undefined,
  };
};
