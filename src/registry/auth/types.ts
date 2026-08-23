import type { RegistryAccessScope, RegistryUserRole, RegistryUserStatus } from '../db/schema';

export type { RegistryAccessScope, RegistryUserRole, RegistryUserStatus };

export const REGISTRY_READ_SCOPE = 'registry:read' as const;
export const REGISTRY_WRITE_SCOPE = 'registry:write' as const;

export interface RegistryUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: RegistryUserRole;
  status: RegistryUserStatus;
  emailVerifiedAt: Date | null;
  authVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A request authenticated by a user-issued, revocable `hnd_*` access token. */
export interface RegistryTokenPrincipal {
  kind: 'access_token';
  tokenId: string;
  userId: string;
  email: string;
  name: string | null;
  role: RegistryUserRole;
  scopes: RegistryAccessScope[];
}

/**
 * A request authenticated by the deployment-wide `HANDOFF_SYNC_SECRET`. The secret is the credential
 * itself, so there is no token row and no owner, only the scopes it grants. Nothing derived from the
 * secret lives here: `redactSecrets` scrubs by key name, so a field like `hash` or `label` would slip
 * into a response body unnoticed.
 */
export interface RegistrySyncSecretPrincipal {
  kind: 'sync_secret';
  scopes: RegistryAccessScope[];
}

/**
 * Whoever a registry request is acting as. Discriminated on `kind` because identity fields exist only
 * for token principals, and both tsconfigs run without `strictNullChecks`: one interface with nullable
 * fields would let `principal.userId` compile against a secret-authenticated request.
 */
export type RegistryPrincipal = RegistryTokenPrincipal | RegistrySyncSecretPrincipal;

export const isRegistryTokenPrincipal = (principal: RegistryPrincipal): principal is RegistryTokenPrincipal =>
  principal.kind === 'access_token';

export const scopesForRegistryRole = (role: RegistryUserRole): RegistryAccessScope[] =>
  role === 'admin' ? [REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE] : [REGISTRY_READ_SCOPE];

export const registryPrincipalHasScope = (principal: RegistryPrincipal, scope: RegistryAccessScope): boolean =>
  principal.scopes.includes(scope);
