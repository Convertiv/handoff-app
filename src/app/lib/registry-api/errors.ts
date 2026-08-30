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
  | 'forbidden'
  | 'not_found'
  | 'method_not_allowed'
  | 'runtime_mode_conflict'
  | 'database_unavailable'
  | 'unexpected_error';

const STATUS_BY_CODE: Record<RegistryErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  method_not_allowed: 405,
  runtime_mode_conflict: 409,
  database_unavailable: 503,
  unexpected_error: 500,
};

/**
 * Optional structured error details. Deliberately closed: an error body must never echo request data
 * back to the client, so every permitted field is named here rather than allowed by an index
 * signature. `rejectedFields` names the fields that failed validation.
 */
export interface RegistryErrorDetails {
  rejectedFields?: string[];
  /** Blob hashes a publish package referenced but never uploaded. */
  missing?: string[];
  /** Artifact reference a publish package required but neither included nor already published. */
  missingReference?: string;
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
