import type { NextApiRequest } from 'next';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';

/**
 * Bearer-token guard for registry management mutations (technical design §9).
 *
 * This is **proof-of-concept protection**, not production auth: a single static token, resolved
 * from the configured env-var *name* at request time (never persisted in config). GET reads are
 * unauthenticated; only mutations (POST/PUT/DELETE) call this guard.
 *
 * - Token env var unset/empty  → `token_not_configured` (503).
 * - `Authorization: Bearer <token>` missing or not an exact match → `unauthorized` (401).
 */
/**
 * Result of {@link authorizeMutation}. Flat (not a discriminated union) because the app compiles
 * with `strictNullChecks` off — `ok` decides, with `code`/`message` set on failure.
 */
export interface MutationAuthResult {
  ok: boolean;
  code?: 'token_not_configured' | 'unauthorized';
  message?: string;
}

/** Length-safe constant-time-ish string comparison to avoid trivial timing leaks. */
const tokensMatch = (provided: string, expected: string): boolean => {
  if (provided.length !== expected.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
};

/** Extract a bearer token from the `Authorization` header, or `''` when absent/malformed. */
const bearerToken = (req: NextApiRequest): string => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') {
    return '';
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : '';
};

/** Authorize a mutation request against the configured static bearer token. */
export const authorizeMutation = (req: NextApiRequest): MutationAuthResult => {
  const { registry } = getServerRuntimeConfig();
  const expected = process.env[registry.apiTokenEnv]?.trim();
  if (!expected) {
    return {
      ok: false,
      code: 'token_not_configured',
      message:
        `Registry management mutations are disabled because the "${registry.apiTokenEnv}" environment ` +
        `variable is not set. Set it to a bearer token to enable mutations.`,
    };
  }
  const provided = bearerToken(req);
  if (!provided || !tokensMatch(provided, expected)) {
    return {
      ok: false,
      code: 'unauthorized',
      message: 'A valid "Authorization: Bearer <token>" header is required for registry management mutations.',
    };
  }
  return { ok: true };
};
