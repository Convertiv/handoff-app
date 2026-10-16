import type { NextApiRequest, NextApiResponse } from 'next';
import { singleQueryValue } from '../api/query';

/**
 * Docs read API error contract.
 *
 * Unlike the registry management API, docs read responses omit `meta` from the
 * `{ error: { code, message } }` envelope. A malformed, unsafe, or missing route parameter maps to
 * `not_found`. A missing record also maps to `not_found`. A missing content artifact or required HTML
 * reference maps to `artifact_not_found`. Invalid query input maps to `invalid_request`. All other
 * errors map to `method_not_allowed` or `unexpected_error`.
 */
export type DocsErrorCode = 'not_found' | 'artifact_not_found' | 'invalid_request' | 'method_not_allowed' | 'unexpected_error';

const STATUS_BY_CODE: Record<DocsErrorCode, number> = {
  not_found: 404,
  artifact_not_found: 404,
  invalid_request: 400,
  method_not_allowed: 405,
  unexpected_error: 500,
};

/** Write a docs read API error response with the status mapped from its code. */
export const sendDocsError = (res: NextApiResponse, code: DocsErrorCode, message: string): void => {
  res.status(STATUS_BY_CODE[code]).json({ error: { code, message } });
};

/**
 * Guard a GET-only docs route. Returns `true` when the request is a GET and the handler should
 * proceed; otherwise it writes a `405 method_not_allowed` response and returns `false`.
 */
export const ensureGet = (req: NextApiRequest, res: NextApiResponse): boolean => {
  if (req.method === 'GET') {
    return true;
  }
  res.setHeader('Allow', 'GET');
  sendDocsError(res, 'method_not_allowed', `Method ${req.method ?? 'unknown'} not allowed; docs read API is GET-only.`);
  return false;
};

/**
 * Resolve an entity id from a dynamic route param that carries an explicit `.json` extension
 * (metadata reads use explicit `.json` URLs). Returns the id without the
 * extension, or `undefined` when the param is missing or not a `.json` request.
 */
export const idFromJsonParam = (value: string | string[] | undefined): string | undefined => {
  const raw = singleQueryValue(value);
  if (!raw || !raw.endsWith('.json')) {
    return undefined;
  }
  const id = raw.slice(0, -'.json'.length);
  return id.length > 0 ? id : undefined;
};
