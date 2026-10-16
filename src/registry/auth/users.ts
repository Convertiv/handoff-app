import { and, count, eq, sql } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';
import { registryUsers, type RegistryUserRole } from '../db/schema';
import { revokeAllRegistryAccessTokens } from './access-tokens';
import { acquireRegistryAdvisoryLock, REGISTRY_ADMIN_LOCK_ID, withRegistryTransaction } from './database';
import { normalizeEmail } from './crypto';
import { verifyPassword } from './password';
import type { RegistryUser, RegistryUserStatus } from './types';
import { toRegistryUser } from './user-record';
import { validateRegistryDisplayName, validateRegistryImageUrl } from './validation';

const DUMMY_PASSWORD_HASH =
  'scrypt-v1:AAAAAAAAAAAAAAAAAAAAAA:yK99vlYIaV57oeErq8gHqx18DxRfiUoHwETrTFUjt5JasWeMsu62stPgY-fO0TUeUc6uAu1hge_vuSQY15vvuQ';

export type RegistryUserMutationResult =
  | { ok: true; user: RegistryUser }
  | {
      ok: false;
      reason: 'not_found' | 'invalid_name' | 'invalid_image' | 'invalid_role' | 'last_admin' | 'self_deactivation' | 'invalid_status';
    };

export const getRegistryUserById = async (db: RegistryDatabase, userId: string): Promise<RegistryUser | null> => {
  const [row] = await db.select().from(registryUsers).where(eq(registryUsers.id, userId)).limit(1);
  return row ? toRegistryUser(row) : null;
};

export const listRegistryUsers = async (db: RegistryDatabase): Promise<RegistryUser[]> => {
  const rows = await db.select().from(registryUsers).orderBy(registryUsers.createdAt);
  return rows.map(toRegistryUser);
};

/** Credentials authentication is intentionally enumeration-safe: all failures return null. */
export const authenticateRegistryCredentials = async (
  db: RegistryDatabase,
  email: string,
  password: string
): Promise<RegistryUser | null> => {
  const normalizedEmail = normalizeEmail(email);
  const [row] = await db.select().from(registryUsers).where(eq(registryUsers.email, normalizedEmail)).limit(1);
  const passwordMatches = await verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
  return row && row.status === 'active' && row.passwordHash && passwordMatches ? toRegistryUser(row) : null;
};

export const updateRegistryUserProfile = async (
  db: RegistryDatabase,
  input: { userId: string; name: string; image?: string | null; now?: Date }
): Promise<RegistryUserMutationResult> => {
  const name = validateRegistryDisplayName(input.name);
  if (!name) return { ok: false, reason: 'invalid_name' };
  const image = validateRegistryImageUrl(input.image);
  if (image === false) return { ok: false, reason: 'invalid_image' };

  const [row] = await db
    .update(registryUsers)
    .set({ name, image, updatedAt: input.now ?? new Date() })
    .where(eq(registryUsers.id, input.userId))
    .returning();
  return row ? { ok: true, user: toRegistryUser(row) } : { ok: false, reason: 'not_found' };
};

export const updateRegistryUserRole = async (
  db: RegistryDatabase,
  input: { userId: string; role: RegistryUserRole; now?: Date }
): Promise<RegistryUserMutationResult> => {
  if (input.role !== 'admin' && input.role !== 'member') return { ok: false, reason: 'invalid_role' };
  return withRegistryTransaction(db, async (tx) => {
    await acquireRegistryAdvisoryLock(tx, REGISTRY_ADMIN_LOCK_ID);
    const [target] = await tx.select().from(registryUsers).where(eq(registryUsers.id, input.userId)).limit(1);
    if (!target) return { ok: false, reason: 'not_found' };
    if (target.role === input.role) return { ok: true, user: toRegistryUser(target) };

    if (target.role === 'admin' && target.status === 'active' && input.role === 'member') {
      const [{ value }] = await tx
        .select({ value: count() })
        .from(registryUsers)
        .where(and(eq(registryUsers.role, 'admin'), eq(registryUsers.status, 'active')));
      if (Number(value) <= 1) return { ok: false, reason: 'last_admin' };
    }

    const now = input.now ?? new Date();
    const [row] = await tx
      .update(registryUsers)
      .set({
        role: input.role,
        authVersion: sql`${registryUsers.authVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(registryUsers.id, input.userId))
      .returning();
    if (target.role === 'admin' && input.role === 'member') {
      await revokeAllRegistryAccessTokens(tx, input.userId, now);
    }
    return { ok: true, user: toRegistryUser(row) };
  });
};

export const setRegistryUserStatus = async (
  db: RegistryDatabase,
  input: {
    userId: string;
    status: Extract<RegistryUserStatus, 'active' | 'deactivated'>;
    actorUserId?: string;
    now?: Date;
  }
): Promise<RegistryUserMutationResult> => {
  if (input.status !== 'active' && input.status !== 'deactivated') {
    return { ok: false, reason: 'invalid_status' };
  }
  if (input.status === 'deactivated' && input.actorUserId === input.userId) {
    return { ok: false, reason: 'self_deactivation' };
  }

  return withRegistryTransaction(db, async (tx) => {
    await acquireRegistryAdvisoryLock(tx, REGISTRY_ADMIN_LOCK_ID);
    const [target] = await tx.select().from(registryUsers).where(eq(registryUsers.id, input.userId)).limit(1);
    if (!target) return { ok: false, reason: 'not_found' };
    if (target.status === input.status) return { ok: true, user: toRegistryUser(target) };
    if (input.status === 'active' && target.status === 'invited') {
      return { ok: false, reason: 'invalid_status' };
    }

    if (target.role === 'admin' && target.status === 'active' && input.status === 'deactivated') {
      const [{ value }] = await tx
        .select({ value: count() })
        .from(registryUsers)
        .where(and(eq(registryUsers.role, 'admin'), eq(registryUsers.status, 'active')));
      if (Number(value) <= 1) return { ok: false, reason: 'last_admin' };
    }

    const now = input.now ?? new Date();
    const [row] = await tx
      .update(registryUsers)
      .set({
        status: input.status,
        authVersion: sql`${registryUsers.authVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(registryUsers.id, input.userId))
      .returning();
    if (input.status === 'deactivated') {
      await revokeAllRegistryAccessTokens(tx, input.userId, now);
    }
    return { ok: true, user: toRegistryUser(row) };
  });
};
