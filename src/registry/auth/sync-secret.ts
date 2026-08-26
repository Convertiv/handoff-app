import { hashSecret, secretHashMatches } from './crypto';
import { REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE, type RegistrySyncSecretPrincipal } from './types';
import { isTransmittableCredential } from './validation';

/**
 * Deployment-wide sync secret.
 *
 * The documented API describes a raw secret carried as a bearer credential for CI-style sync, which is
 * what this module resolves. It is the credential itself, so presenting it issues no token and creates
 * no session: no owner, no expiry, no usage trail, and unsetting the variable is the only way to
 * withdraw it. User-issued `hnd_*` tokens stay the canonical path, and this is off whenever the
 * variable is absent.
 */

/** Env var holding the raw secret. Read per call so unsetting it takes effect on restart alone. */
export const SYNC_SECRET_ENV = 'HANDOFF_SYNC_SECRET';

/** Prefix reserved for issued access tokens; see `formatRegistryAccessToken`. */
const RESERVED_TOKEN_PREFIX = 'hnd_';

type MisconfigurationReason = 'untransmittable' | 'token_shaped';

/** Reasons already reported, so a misconfigured deployment warns once rather than once per request. */
const warned = new Set<MisconfigurationReason>();

const warnOnce = (reason: MisconfigurationReason, detail: string): void => {
  if (warned.has(reason)) return;
  warned.add(reason);
  console.warn(`${SYNC_SECRET_ENV} is ignored: ${detail}`);
};

/**
 * The configured secret, or `''` when this method is unavailable. Never returns a value that could not
 * be presented in every accepted header, or one using the access-token prefix: credentials are routed
 * by shape, so such a secret would be permanently unreachable. Both cases warn instead.
 */
export const resolveRegistrySyncSecret = (env: NodeJS.ProcessEnv = process.env): string => {
  const configured = env[SYNC_SECRET_ENV]?.trim() ?? '';
  if (!configured) return '';
  if (!isTransmittableCredential(configured)) {
    warnOnce('untransmittable', 'the value must be printable ASCII with no spaces or commas to be sent in a request header.');
    return '';
  }
  if (configured.startsWith(RESERVED_TOKEN_PREFIX)) {
    warnOnce('token_shaped', `the value starts with the \`${RESERVED_TOKEN_PREFIX}\` prefix reserved for issued access tokens.`);
    return '';
  }
  return configured;
};

/**
 * Resolve a raw credential into a sync-secret principal, granting registry read and write.
 *
 * The empty checks have to come first: `hashSecret('')` is a valid digest that matches itself, so
 * hashing up front would authenticate an empty credential on any deployment that leaves
 * {@link SYNC_SECRET_ENV} unset. The comparison runs over fixed-length digests, so it is constant time
 * and leaks no length.
 */
export const authenticateRegistrySyncSecret = (
  credential: string,
  env: NodeJS.ProcessEnv = process.env
): RegistrySyncSecretPrincipal | null => {
  const configured = resolveRegistrySyncSecret(env);
  if (!configured || !credential) return null;
  if (!secretHashMatches(credential, hashSecret(configured))) return null;
  return { kind: 'sync_secret', scopes: [REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE] };
};
