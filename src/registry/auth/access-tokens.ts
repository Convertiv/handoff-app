import { and, eq, gt, isNull } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';
import { registryAccessTokens, registryUsers, type RegistryAccessScope } from '../db/schema';
import { createOpaqueSecret, hashSecret, secretHashMatches } from './crypto';
import { withRegistryTransaction } from './database';
import { REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE, type RegistryPrincipal, type RegistryUserRole } from './types';

const ACCESS_TOKEN_PREFIX = 'hnd';
const DEFAULT_ACCESS_TOKEN_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

export interface RegistryAccessTokenSummary {
  id: string;
  name: string;
  scopes: RegistryAccessScope[];
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export type CreateRegistryAccessTokenResult =
  | { ok: true; token: string; record: RegistryAccessTokenSummary }
  | { ok: false; reason: 'user_not_found' | 'user_inactive' | 'scope_forbidden' | 'invalid_name' | 'invalid_expiry' };

const isRegistryScope = (value: unknown): value is RegistryAccessScope => value === REGISTRY_READ_SCOPE || value === REGISTRY_WRITE_SCOPE;

export const normalizeRegistryScopes = (scopes: readonly RegistryAccessScope[]): RegistryAccessScope[] => {
  const unique = new Set(scopes.filter(isRegistryScope));
  return [REGISTRY_READ_SCOPE, REGISTRY_WRITE_SCOPE].filter((scope) => unique.has(scope));
};

export const registryRoleAllowsScopes = (role: RegistryUserRole, scopes: readonly RegistryAccessScope[]): boolean =>
  role === 'admin' || !scopes.includes(REGISTRY_WRITE_SCOPE);

export const formatRegistryAccessToken = (id: string, secret: string): string => `${ACCESS_TOKEN_PREFIX}_${id}_${secret}`;

export const parseRegistryAccessToken = (token: string): { id: string; secret: string } | null => {
  const match = /^hnd_([A-Za-z0-9_-]{16})_([A-Za-z0-9_-]{43})$/.exec(token.trim());
  return match ? { id: match[1], secret: match[2] } : null;
};

const createRegistryAccessTokenInTransaction = async (
  db: RegistryDatabase,
  input: {
    userId: string;
    name: string;
    scopes: RegistryAccessScope[];
    expiresAt?: Date;
    now?: Date;
  }
): Promise<CreateRegistryAccessTokenResult> => {
  const name = input.name.trim();
  if (!name || name.length > 120) return { ok: false, reason: 'invalid_name' };

  const now = input.now ?? new Date();
  const expiresAt = input.expiresAt ?? new Date(now.getTime() + DEFAULT_ACCESS_TOKEN_LIFETIME_MS);
  if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= now) {
    return { ok: false, reason: 'invalid_expiry' };
  }

  const [user] = await db
    .select({ id: registryUsers.id, role: registryUsers.role, status: registryUsers.status })
    .from(registryUsers)
    .where(eq(registryUsers.id, input.userId))
    .limit(1)
    .for('update');
  if (!user) return { ok: false, reason: 'user_not_found' };
  if (user.status !== 'active') return { ok: false, reason: 'user_inactive' };

  const scopes = normalizeRegistryScopes(input.scopes);
  if (!scopes.length) scopes.push(REGISTRY_READ_SCOPE);
  if (!registryRoleAllowsScopes(user.role, scopes)) return { ok: false, reason: 'scope_forbidden' };

  const id = createOpaqueSecret(12);
  const secret = createOpaqueSecret(32);
  const [record] = await db
    .insert(registryAccessTokens)
    .values({
      id,
      userId: user.id,
      name,
      secretHash: hashSecret(secret),
      scopes,
      expiresAt,
    })
    .returning({
      id: registryAccessTokens.id,
      name: registryAccessTokens.name,
      scopes: registryAccessTokens.scopes,
      expiresAt: registryAccessTokens.expiresAt,
      lastUsedAt: registryAccessTokens.lastUsedAt,
      revokedAt: registryAccessTokens.revokedAt,
      createdAt: registryAccessTokens.createdAt,
    });

  return { ok: true, token: formatRegistryAccessToken(id, secret), record };
};

export const createRegistryAccessToken = async (
  db: RegistryDatabase,
  input: {
    userId: string;
    name: string;
    scopes: RegistryAccessScope[];
    expiresAt?: Date;
    now?: Date;
  }
): Promise<CreateRegistryAccessTokenResult> => withRegistryTransaction(db, (tx) => createRegistryAccessTokenInTransaction(tx, input));

export const listRegistryAccessTokens = async (db: RegistryDatabase, userId: string): Promise<RegistryAccessTokenSummary[]> =>
  db
    .select({
      id: registryAccessTokens.id,
      name: registryAccessTokens.name,
      scopes: registryAccessTokens.scopes,
      expiresAt: registryAccessTokens.expiresAt,
      lastUsedAt: registryAccessTokens.lastUsedAt,
      revokedAt: registryAccessTokens.revokedAt,
      createdAt: registryAccessTokens.createdAt,
    })
    .from(registryAccessTokens)
    .where(eq(registryAccessTokens.userId, userId))
    .orderBy(registryAccessTokens.createdAt);

export const revokeRegistryAccessToken = async (
  db: RegistryDatabase,
  input: { tokenId: string; userId: string; now?: Date }
): Promise<boolean> => {
  const rows = await db
    .update(registryAccessTokens)
    .set({ revokedAt: input.now ?? new Date() })
    .where(
      and(eq(registryAccessTokens.id, input.tokenId), eq(registryAccessTokens.userId, input.userId), isNull(registryAccessTokens.revokedAt))
    )
    .returning({ id: registryAccessTokens.id });
  return rows.length > 0;
};

export const revokeAllRegistryAccessTokens = async (db: RegistryDatabase, userId: string, now = new Date()): Promise<number> => {
  const rows = await db
    .update(registryAccessTokens)
    .set({ revokedAt: now })
    .where(and(eq(registryAccessTokens.userId, userId), isNull(registryAccessTokens.revokedAt)))
    .returning({ id: registryAccessTokens.id });
  return rows.length;
};

/**
 * Resolve an opaque bearer credential into a live principal. User state is joined on every call,
 * making deactivation effective even if a defensive token-revocation write was interrupted.
 */
export const authenticateRegistryAccessToken = async (
  db: RegistryDatabase,
  token: string,
  now = new Date()
): Promise<RegistryPrincipal | null> => {
  const parsed = parseRegistryAccessToken(token);
  if (!parsed) return null;

  const [row] = await db
    .select({
      tokenId: registryAccessTokens.id,
      secretHash: registryAccessTokens.secretHash,
      scopes: registryAccessTokens.scopes,
      expiresAt: registryAccessTokens.expiresAt,
      revokedAt: registryAccessTokens.revokedAt,
      userId: registryUsers.id,
      email: registryUsers.email,
      name: registryUsers.name,
      role: registryUsers.role,
      status: registryUsers.status,
    })
    .from(registryAccessTokens)
    .innerJoin(registryUsers, eq(registryUsers.id, registryAccessTokens.userId))
    .where(eq(registryAccessTokens.id, parsed.id))
    .limit(1);

  if (!row || row.status !== 'active' || row.revokedAt || row.expiresAt <= now || !secretHashMatches(parsed.secret, row.secretHash)) {
    return null;
  }

  const scopes = normalizeRegistryScopes(Array.isArray(row.scopes) ? row.scopes : []);
  const updated = await db
    .update(registryAccessTokens)
    .set({ lastUsedAt: now })
    .where(and(eq(registryAccessTokens.id, row.tokenId), isNull(registryAccessTokens.revokedAt), gt(registryAccessTokens.expiresAt, now)))
    .returning({ id: registryAccessTokens.id });
  if (!updated.length) return null;

  return {
    tokenId: row.tokenId,
    userId: row.userId,
    email: row.email,
    name: row.name,
    role: row.role,
    scopes,
  };
};
