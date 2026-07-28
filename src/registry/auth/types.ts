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

export interface RegistryPrincipal {
  tokenId: string;
  userId: string;
  email: string;
  name: string | null;
  role: RegistryUserRole;
  scopes: RegistryAccessScope[];
}

export const scopesForRegistryRole = (role: RegistryUserRole): RegistryAccessScope[] =>
  role === 'admin' ? [REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE] : [REGISTRY_READ_SCOPE];

export const registryPrincipalHasScope = (principal: RegistryPrincipal, scope: RegistryAccessScope): boolean =>
  principal.scopes.includes(scope);
