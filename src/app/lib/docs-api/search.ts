import type { NextApiRequest } from 'next';
import { singleQueryValue } from '../api/query';

/**
 * Shared search contract for the docs read API.
 *
 * Every `/api/docs/search/*` route uses this query parser and response envelope. Each resource module
 * defines its additional inputs and result shape.
 */

/** Shortest term that is worth matching. A one-character term occurs in almost every page. */
export const MIN_TERM_LENGTH = 2;
/**
 * Limits for a public search query. Each term creates leading-wildcard predicates, so an unrestricted
 * query causes an unrestricted scan. Reject excess input because trimming can change the requested query.
 */
export const MAX_QUERY_LENGTH = 200;
export const MAX_TERMS = 12;
export const DEFAULT_RESULT_LIMIT = 20;
export const MAX_RESULT_LIMIT = 50;
export const MAX_SEARCH_CANDIDATES = 500;
/**
 * Characters of a page body that search reads. With no bound, one anonymous request costs whatever the project
 * published: a broad query reads every candidate body in full, and only the publish route limits the size of a page.
 * A term after this prefix is unfindable in both modes — registry search cuts in SQL, workspace search cuts the file
 * it read — and both must cut at the same length so that they rank the same text.
 */
export const MAX_SEARCH_BODY_LENGTH = 32_768;

/** A parsed, validated search request. */
export interface SearchRequest {
  /** The caller's raw query, echoed back in the response. */
  query: string;
  /** Deduped, normalized terms, each at least {@link MIN_TERM_LENGTH} long. */
  terms: string[];
  /**
   * The complete normalized query, including terms that are too short for individual matches. Ranking
   * uses it for phrase matches such as `state of the art`.
   */
  phrase: string;
  limit: number;
}

/** The envelope every search route returns, whatever it searches. */
export interface SearchResponse<TResult> {
  query: string;
  results: TResult[];
  /**
   * True when the candidate cap or result limit removes matches. The response omits a total because
   * a capped candidate set cannot produce an accurate value.
   */
  truncated: boolean;
}

/**
 * Convert text to lowercase and replace `-` and `_` with spaces. This makes `getting-started` match
 * `Getting Started`.
 *
 * The replacement preserves the string length. Thus, an index in normalized text identifies the same
 * character in the original Markdown.
 */
export const normalizeSearchText = (value: string): string => value.toLowerCase().replace(/[-_]/g, ' ');

const parseLimit = (raw: string | undefined): number => {
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed)) {
    return DEFAULT_RESULT_LIMIT;
  }
  return Math.max(1, Math.min(MAX_RESULT_LIMIT, Math.floor(parsed)));
};

/**
 * Parse the required `q` parameter and optional `limit` parameter. Search ignores short terms instead
 * of rejecting the full query. The request fails only when it contains no usable term.
 */
export const parseSearchRequest = (req: NextApiRequest): { request: SearchRequest } | { error: string } => {
  const query = singleQueryValue(req.query.q)?.trim() ?? '';
  if (!query) {
    return { error: 'Provide a non-empty `q` search parameter.' };
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return { error: `Search query is longer than ${MAX_QUERY_LENGTH} characters.` };
  }
  const phrase = normalizeSearchText(query);
  const terms = Array.from(new Set(phrase.split(/\s+/).filter((term) => term.length >= MIN_TERM_LENGTH)));
  if (terms.length === 0) {
    return { error: `Search query must contain a term with at least ${MIN_TERM_LENGTH} characters.` };
  }
  if (terms.length > MAX_TERMS) {
    return { error: `Search query must contain no more than ${MAX_TERMS} distinct terms.` };
  }
  return { request: { query, terms, phrase, limit: parseLimit(singleQueryValue(req.query.limit)) } };
};
