import type { NextApiResponse } from 'next';
import { buildMeta, type RegistryMeta } from './meta';

/**
 * Registry management API error contract.
 *
 * Every response — including errors — uses the `{ error, meta }` envelope (the docs read API, by
 * contrast, uses a bare `{ error }`). `details.rejectedFields` carries field-level rejection detail
 * for allowlist/file-kind failures.
 */
export type RegistryErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'not_found'
  | 'method_not_allowed'
  | 'runtime_mode_conflict'
  | 'token_not_configured'
  | 'database_unavailable'
  | 'unexpected_error';

const STATUS_BY_CODE: Record<RegistryErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  not_found: 404,
  method_not_allowed: 405,
  runtime_mode_conflict: 409,
  token_not_configured: 503,
  database_unavailable: 503,
  unexpected_error: 500,
};

/** Optional structured error details. `rejectedFields` names the fields that failed validation. */
export interface RegistryErrorDetails {
  rejectedFields?: string[];
  [key: string]: unknown;
}

/** Write a registry API error response with the status mapped from its code, plus the `meta` envelope. */
export const sendRegistryError = (
  res: NextApiResponse,
  code: RegistryErrorCode,
  message: string,
  details?: RegistryErrorDetails,
  meta: RegistryMeta = buildMeta()
): void => {
  res.status(STATUS_BY_CODE[code]).json({
    error: { code, message, ...(details ? { details } : {}) },
    meta,
  });
};
