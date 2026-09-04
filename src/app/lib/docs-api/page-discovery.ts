import fs from 'fs-extra';
import path from 'path';
import { normalizePageDeclaration } from '@handoff/config/normalizers/page';
import { HOME_PAGE_ID, HOME_PAGE_PATH } from '@handoff/registry/content-kinds';
import type { PageListObject } from '@handoff/transformers/preview/types';
import { parseMarkdown } from '@handoff/utils/markdown';
import { collectPageSlugSegments } from '@handoff/utils/pages';
import {
  isPageEnabled,
  isPageInGroup,
  pageMatches,
  rankPages,
  toSearchablePage,
  type PageSearchRequest,
  type PageSearchResult,
  type SearchablePage,
} from './page-search';
import { MAX_SEARCH_BODY_LENGTH, MAX_SEARCH_CANDIDATES, type SearchResponse } from './search';

/**
 * Workspace search uses package defaults from `config/docs` and overlays the project's `pages/`
 * directory. This is the same precedence rule that routing and navigation use.
 *
 * Each search discovers files again, so `dev` and `start` detect page changes without a restart.
 * A size-and-modification-time cache prevents repeated frontmatter parsing for unchanged files. The
 * cache stores only normalized records. The search reads page bodies on demand and does not cache them.
 */

interface DiscoveredPage {
  record: PageListObject;
  absolutePath: string;
}

interface CachedPage extends DiscoveredPage {
  mtimeMs: number;
  size: number;
}

const discoveryCache = new Map<string, CachedPage>();

/** Project pages replace package defaults with the same ID. */
const pageRoots = (): string[] => [
  path.resolve(process.env.HANDOFF_MODULE_PATH ?? '', 'config', 'docs'),
  path.resolve(process.env.HANDOFF_WORKING_PATH ?? '', 'pages'),
];

/** Reuse a cached record when the file size and modification time have not changed. */
const readRecord = (id: string, absolutePath: string): CachedPage | null => {
  let stats: fs.Stats;
  try {
    stats = fs.statSync(absolutePath);
  } catch {
    discoveryCache.delete(id);
    return null;
  }
  const cached = discoveryCache.get(id);
  if (cached && cached.absolutePath === absolutePath && cached.mtimeMs === stats.mtimeMs && cached.size === stats.size) {
    return cached;
  }
  try {
    const { data } = parseMarkdown(fs.readFileSync(absolutePath, 'utf8'));
    const routePath = id === HOME_PAGE_ID ? HOME_PAGE_PATH : `/${id}`;
    const page: CachedPage = {
      record: normalizePageDeclaration(data, { id, routePath, sourcePath: absolutePath }),
      absolutePath,
      mtimeMs: stats.mtimeMs,
      size: stats.size,
    };
    discoveryCache.set(id, page);
    return page;
  } catch {
    discoveryCache.delete(id);
    return null;
  }
};

/** Return effective workspace pages in ID order so the candidate cap is deterministic. */
const discoverPages = (): DiscoveredPage[] => {
  const located = new Map<string, string>();
  for (const root of pageRoots()) {
    for (const segments of collectPageSlugSegments(root, { includeRootIndex: true })) {
      const id = segments.join('/');
      located.set(id, path.resolve(root, `${id}.md`));
    }
  }
  for (const id of Array.from(discoveryCache.keys())) {
    if (!located.has(id)) {
      discoveryCache.delete(id);
    }
  }
  return Array.from(located.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, absolutePath]) => readRecord(id, absolutePath))
    .filter((page): page is CachedPage => page !== null);
};

const readBody = (absolutePath: string): string => {
  try {
    return parseMarkdown(fs.readFileSync(absolutePath, 'utf8')).content.slice(0, MAX_SEARCH_BODY_LENGTH);
  } catch {
    return '';
  }
};

export const searchWorkspacePages = (request: PageSearchRequest): SearchResponse<PageSearchResult> => {
  const eligible = discoverPages().filter((page) => isPageEnabled(page.record) && isPageInGroup(page.record, request.group));

  // The cap counts matches, as registry search does. Capping all pages would make the runtime modes
  // return different results and report truncation when no match was removed.
  const candidates: SearchablePage[] = [];
  let capped = false;
  for (const page of eligible) {
    const candidate = toSearchablePage(page.record, page.record.external ? '' : readBody(page.absolutePath));
    if (!pageMatches(candidate, request)) {
      continue;
    }
    if (candidates.length === MAX_SEARCH_CANDIDATES) {
      capped = true;
      break;
    }
    candidates.push(candidate);
  }

  const { results, truncated } = rankPages(candidates, request);
  return { query: request.query, results, truncated: truncated || capped };
};
