import type { NextApiRequest } from 'next';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import {
  authenticateRegistryAccessToken,
  authenticateRegistrySyncSecret,
  hashSecret,
  isTransmittableCredential,
  parseRegistryAccessToken,
  registryPrincipalHasScope,
  REGISTRY_READ_SCOPE,
  REGISTRY_WRITE_SCOPE,
  type RegistryAccessScope,
  type RegistryPrincipal,
} from '@handoff/registry/auth';

export interface RegistryAuthResult {
  ok: boolean;
  code?: 'bad_request' | 'unauthorized' | 'forbidden';
  message?: string;
  principal?: RegistryPrincipal;
}

/** Documented alternative to `Authorization: Bearer` for carrying the same credential. */
const API_KEY_HEADER = 'x-handoff-api-key';

/** Methods that mutate state and therefore require the `registry:write` scope; all others read. */
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** The scope a request needs, derived from its method. Reads include `HEAD` and `OPTIONS`. */
export const requiredScopeForMethod = (method: string): RegistryAccessScope =>
  MUTATION_METHODS.has(method.toUpperCase()) ? REGISTRY_WRITE_SCOPE : REGISTRY_READ_SCOPE;

/**
 * Read `Authorization: Bearer <credential>`. Node keeps only the first `Authorization` header, so this
 * is never a join of several, and any other scheme yields no credential rather than a malformed one.
 * The value is left unvalidated on purpose: something we do not recognize is an unknown credential
 * rather than a bad request, and `401` says that.
 */
const bearerCredential = (req: NextApiRequest): string => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || '';
};

/**
 * Read `X-Handoff-Api-Key`. Node does not de-duplicate this header the way it does `Authorization`, so
 * repeats arrive as an array or joined with `, `. Either way it is unclear which credential was meant,
 * so we reject (`null`) instead of picking one. {@link isTransmittableCredential} rules out the joined
 * form by the same rule a configured secret must pass, so nothing is accepted through one carrier and
 * rejected by the other.
 */
const apiKeyCredential = (req: NextApiRequest): string | null => {
  const header = req.headers[API_KEY_HEADER];
  if (header === undefined) return '';
  if (typeof header !== 'string') return null;
  const value = header.trim();
  if (!value) return '';
  return isTransmittableCredential(value) ? value : null;
};

/** Discriminated on `kind` because a boolean does not narrow without `strictNullChecks`. */
export type RegistryCredentialResult = { kind: 'credential'; credential: string } | { kind: 'rejected'; message: string };

/**
 * Resolve the single credential a request presents, from either carrier. Sending the same value in both
 * is fine; sending two different ones is an ambiguous request rather than a failed authentication, so
 * it is rejected before any lookup. Neither branch echoes a header value back to the caller.
 */
export const readRegistryCredential = (req: NextApiRequest): RegistryCredentialResult => {
  const bearer = bearerCredential(req);
  const apiKey = apiKeyCredential(req);
  if (apiKey === null) {
    return { kind: 'rejected', message: `The ${API_KEY_HEADER} header must carry exactly one credential.` };
  }
  // Both values come from the caller, so there is nothing secret to guard here; hashing just keeps the
  // check uniform with every other credential comparison.
  if (bearer && apiKey && hashSecret(bearer) !== hashSecret(apiKey)) {
    return {
      kind: 'rejected',
      message: `The Authorization and ${API_KEY_HEADER} headers carry different credentials. Send the credential in one of them.`,
    };
  }
  return { kind: 'credential', credential: bearer || apiKey };
};

/**
 * Route a credential by its shape: anything matching the `hnd_` grammar is only checked against issued
 * tokens, anything else only against the configured sync secret. Each credential takes one path, so
 * secret-authenticated requests cost no query.
 */
const authenticateRegistryCredential = async (db: RegistryDatabase, credential: string): Promise<RegistryPrincipal | null> =>
  parseRegistryAccessToken(credential) ? authenticateRegistryAccessToken(db, credential) : authenticateRegistrySyncSecret(credential);

/**
 * Authorize a registry request with a credential carrying the required scope: reads need
 * `registry:read`, mutations need `registry:write`. Every `/api/registry/*` request goes through this;
 * there are no public endpoints behind the guard stack.
 *
 * Either carrier is accepted, with two credential types. A live, revocable user token is the canonical
 * one and keeps its ownership, expiry, revocation and usage tracking. The deployment-wide
 * `HANDOFF_SYNC_SECRET`, when set, is accepted as itself and grants registry read and write.
 */
export const authorizeRegistryRequest = async (
  req: NextApiRequest,
  db: RegistryDatabase,
  scope: RegistryAccessScope
): Promise<RegistryAuthResult> => {
  const credential = readRegistryCredential(req);
  if (credential.kind === 'rejected') {
    return { ok: false, code: 'bad_request', message: credential.message };
  }

  const principal = await authenticateRegistryCredential(db, credential.credential);
  if (!principal) {
    return {
      ok: false,
      code: 'unauthorized',
      message:
        'A valid credential is required in an `Authorization: Bearer` or `X-Handoff-Api-Key` header. Run `handoff-app login`, or create a CI token in registry Account settings.',
    };
  }
  if (!registryPrincipalHasScope(principal, scope)) {
    return {
      ok: false,
      code: 'forbidden',
      message: `This credential does not include the ${scope} scope.`,
    };
  }
  return { ok: true, principal };
};
