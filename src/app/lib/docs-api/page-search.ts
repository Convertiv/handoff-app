import type { PageListObject } from '@handoff/transformers/preview/types';
import { normalizeSearchText, type SearchRequest } from './search';

/**
 * Shared ranking and snippet logic for page search.
 *
 * Workspace mode reads the filesystem, while registry mode uses a SQL filter. Both modes pass
 * candidates to {@link rankPages}, which produces consistent results. {@link SearchablePage} limits
 * search to approved fields and excludes source paths, SEO fields, navigation, sort weights, and
 * review metadata.
 */

/** Fields available to page search. The external link target is intentionally absent. */
export interface SearchablePage {
  id: string;
  /** Internal route for the page (`/guides/setup`, or `/` for the home page). */
  url: string;
  title: string;
  menuTitle?: string;
  description?: string;
  /** Markdown body without its frontmatter. Empty for an external-link page. */
  body: string;
}

/** One display-ready search hit. */
export interface PageSearchResult {
  url: string;
  title: string;
  description?: string;
  /** Plain text taken from the body around the first match. Empty when the page has no body. */
  snippet: string;
}

/** Shared search inputs and the page-specific group filter. */
export type PageSearchRequest = SearchRequest & { group?: string };

/**
 * Relevance weights per field group. The gaps are wider than either bonus, so field priority always
 * wins: one term in a title outranks every term in a body.
 */
const TITLE_WEIGHT = 10;
const DESCRIPTION_WEIGHT = 4;
const BODY_WEIGHT = 1;
const ALL_TERMS_BONUS = 2;
const PHRASE_BONUS_RATIO = 0.5;

const SNIPPET_LENGTH = 220;
const SNIPPET_LEAD = 60;

/** A page is searchable unless its frontmatter disables it. An unset `enabled` field means enabled. */
export const isPageEnabled = (record: PageListObject): boolean => record.enabled !== false;

/** The group is only a filter. It is not searchable text. An unset filter accepts every page. */
export const isPageInGroup = (record: PageListObject, group: string | undefined): boolean =>
  !group || (record.group ?? '').toLowerCase() === group.toLowerCase();

/** Limit a page to the fields that search can read. */
export const toSearchablePage = (record: PageListObject, markdown: string): SearchablePage => ({
  id: record.id,
  url: record.path,
  title: record.title,
  menuTitle: record.menuTitle,
  description: record.description,
  // Search external pages by visible metadata only. Do not expose the external target in a result.
  body: record.external ? '' : markdown,
});

/**
 * Remove Markdown from a snippet. A snippet can start inside a Markdown construct and retain a stray
 * marker. Parsing only the snippet avoids parsing the complete body.
 */
const stripMarkdown = (value: string): string =>
  value
    .replace(/^\s{0,3}(?:```|~~~)[^\n]*$/gm, ' ')
    .replace(/^\s{0,3}\[[^\]]+\]:\s*\S+.*$/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^\s{0,3}>+\s?/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, ' ')
    .replace(/[`*~]/g, '')
    // Only word-edge underscores are emphasis. An inner underscore belongs to an identifier such as `page_files`.
    .replace(/(?<![A-Za-z0-9])_+|_+(?![A-Za-z0-9])/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const firstMatchIndex = (normalizedBody: string, terms: string[]): number => {
  let first = -1;
  for (const term of terms) {
    const index = normalizedBody.indexOf(term);
    if (index !== -1 && (first === -1 || index < first)) {
      first = index;
    }
  }
  return first;
};

/**
 * Build a plain-text excerpt around the first body match. A page that matched on its title alone has
 * no body match, so the excerpt starts at the top of the body instead.
 */
const buildSnippet = (body: string, terms: string[]): string => {
  if (!body.trim()) {
    return '';
  }
  const match = firstMatchIndex(normalizeSearchText(body), terms);
  let start = match === -1 ? 0 : Math.max(0, match - SNIPPET_LEAD);
  // Keep whole words at both cuts.
  if (start > 0) {
    const boundary = body.slice(start).search(/\s/);
    start = boundary === -1 ? start : start + boundary + 1;
  }
  let end = Math.min(body.length, start + SNIPPET_LENGTH);
  if (end < body.length) {
    const boundary = body.slice(start, end).search(/\s\S*$/);
    if (boundary > 0) {
      end = start + boundary;
    }
  }
  const snippet = stripMarkdown(body.slice(start, end));
  if (!snippet) {
    return '';
  }
  return `${start > 0 ? '…' : ''}${snippet}${end < body.length ? '…' : ''}`;
};

const searchableFields = (page: SearchablePage): { text: string; weight: number }[] => [
  { text: normalizeSearchText(`${page.title} ${page.menuTitle ?? ''}`), weight: TITLE_WEIGHT },
  { text: normalizeSearchText(page.description ?? ''), weight: DESCRIPTION_WEIGHT },
  { text: normalizeSearchText(page.body), weight: BODY_WEIGHT },
];

/**
 * A page is a candidate when one term occurs in one searchable field.
 *
 * The store candidate cap applies to this set, so both runtime modes cap the same population.
 * {@link rankPages} keeps the same set because a page with no matching term scores `0`.
 */
export const pageMatches = (page: SearchablePage, request: SearchRequest): boolean => {
  const fields = searchableFields(page);
  return request.terms.some((term) => fields.some((field) => field.text.includes(term)));
};

/**
 * Relevance for one page. Each term counts once per field group, so text repeated within a field
 * cannot raise the score. A page that matches nothing scores `0` and is dropped by {@link rankPages}.
 */
const scorePage = (page: SearchablePage, request: SearchRequest): number => {
  const fields = searchableFields(page);
  const matched = new Set<string>();
  let score = 0;
  for (const field of fields) {
    const hits = request.terms.filter((term) => field.text.includes(term));
    if (hits.length === 0) {
      continue;
    }
    hits.forEach((term) => matched.add(term));
    score += field.weight * (hits.length / request.terms.length);
    if (request.terms.length > 1 && field.text.includes(request.phrase)) {
      score += field.weight * PHRASE_BONUS_RATIO;
    }
  }
  if (matched.size === request.terms.length) {
    score += ALL_TERMS_BONUS;
  }
  return score;
};

/**
 * Score, order, and trim candidates. Page ID breaks score ties, so both modes return a stable order.
 * `truncated` is true when the result limit removes matches.
 */
export const rankPages = (candidates: SearchablePage[], request: SearchRequest): { results: PageSearchResult[]; truncated: boolean } => {
  const matches = candidates
    .map((page) => ({ page, score: scorePage(page, request) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || (a.page.id < b.page.id ? -1 : a.page.id > b.page.id ? 1 : 0));

  const results = matches.slice(0, request.limit).map(({ page }) => ({
    url: page.url,
    title: page.title,
    ...(page.description ? { description: page.description } : {}),
    snippet: buildSnippet(page.body, request.terms),
  }));

  return { results, truncated: matches.length > request.limit };
};
