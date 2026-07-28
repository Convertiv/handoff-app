import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { RegistryDatabase } from '../db/client';
import { registryAuthActionTokens, registryUsers, type RegistryAuthActionPurpose, type RegistryUserRole } from '../db/schema';
import { revokeAllRegistryAccessTokens } from './access-tokens';
import { createOpaqueSecret, hashSecret, normalizeEmail } from './crypto';
import { withRegistryTransaction } from './database';
import { hashPassword, validatePassword } from './password';
import type { RegistryUser } from './types';
import { toRegistryUser } from './user-record';
import { validateRegistryDisplayName, validateRegistryEmail } from './validation';

export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_LIFETIME_MS = 60 * 60 * 1000;

export type CreateUserInvitationResult =
  | { ok: true; user: RegistryUser; token: string; expiresAt: Date }
  | { ok: false; reason: 'invalid_email' | 'invalid_name' | 'invalid_role' | 'email_exists' };

export type ResendUserInvitationResult =
  | { ok: true; user: RegistryUser; token: string; expiresAt: Date }
  | { ok: false; reason: 'not_found' | 'already_accepted' | 'deactivated' };

export type ConsumeAuthActionResult =
  | { ok: true; user: RegistryUser }
  | { ok: false; reason: 'invalid_or_expired_token' | 'invalid_password'; error?: string };

const invalidateUnusedActionTokens = async (
  db: RegistryDatabase,
  userId: string,
  purpose: RegistryAuthActionPurpose,
  now: Date
): Promise<void> => {
  await db
    .update(registryAuthActionTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(registryAuthActionTokens.userId, userId),
        eq(registryAuthActionTokens.purpose, purpose),
        isNull(registryAuthActionTokens.usedAt)
      )
    );
};

const insertActionToken = async (
  db: RegistryDatabase,
  userId: string,
  purpose: RegistryAuthActionPurpose,
  expiresAt: Date,
  now: Date
): Promise<string> => {
  const token = createOpaqueSecret(32);
  await db.insert(registryAuthActionTokens).values({
    id: randomUUID(),
    userId,
    purpose,
    tokenHash: hashSecret(token),
    expiresAt,
    createdAt: now,
  });
  return token;
};

export const createUserInvitation = async (
  db: RegistryDatabase,
  input: {
    email: string;
    name: string;
    role: RegistryUserRole;
    now?: Date;
    expiresAt?: Date;
  }
): Promise<CreateUserInvitationResult> => {
  const email = validateRegistryEmail(input.email);
  if (!email) return { ok: false, reason: 'invalid_email' };
  const name = validateRegistryDisplayName(input.name);
  if (!name) return { ok: false, reason: 'invalid_name' };
  if (input.role !== 'admin' && input.role !== 'member') return { ok: false, reason: 'invalid_role' };
  const now = input.now ?? new Date();
  const expiresAt = input.expiresAt ?? new Date(now.getTime() + INVITATION_LIFETIME_MS);

  return withRegistryTransaction(db, async (tx) => {
    const userId = randomUUID();
    const rows = await tx
      .insert(registryUsers)
      .values({
        id: userId,
        email,
        name,
        role: input.role,
        status: 'invited',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    const user = rows[0];
    if (!user) return { ok: false, reason: 'email_exists' };

    const token = await insertActionToken(tx, userId, 'invite', expiresAt, now);
    return { ok: true, user: toRegistryUser(user), token, expiresAt };
  });
};

export const resendUserInvitation = async (
  db: RegistryDatabase,
  input: { userId: string; now?: Date; expiresAt?: Date }
): Promise<ResendUserInvitationResult> =>
  withRegistryTransaction(db, async (tx) => {
    const [user] = await tx.select().from(registryUsers).where(eq(registryUsers.id, input.userId)).limit(1).for('update');
    if (!user) return { ok: false, reason: 'not_found' };
    if (user.status === 'active') return { ok: false, reason: 'already_accepted' };
    if (user.status === 'deactivated') return { ok: false, reason: 'deactivated' };

    const now = input.now ?? new Date();
    const expiresAt = input.expiresAt ?? new Date(now.getTime() + INVITATION_LIFETIME_MS);
    await invalidateUnusedActionTokens(tx, user.id, 'invite', now);
    const token = await insertActionToken(tx, user.id, 'invite', expiresAt, now);
    return { ok: true, user: toRegistryUser(user), token, expiresAt };
  });

export const acceptUserInvitation = async (
  db: RegistryDatabase,
  input: { token: string; password: string; now?: Date }
): Promise<ConsumeAuthActionResult> => {
  const validation = validatePassword(input.password);
  if ('error' in validation) return { ok: false, reason: 'invalid_password', error: validation.error };
  const passwordHash = await hashPassword(input.password);
  const now = input.now ?? new Date();

  return withRegistryTransaction(db, async (tx) => {
    const [consumed] = await tx
      .update(registryAuthActionTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(registryAuthActionTokens.tokenHash, hashSecret(input.token)),
          eq(registryAuthActionTokens.purpose, 'invite'),
          isNull(registryAuthActionTokens.usedAt),
          gt(registryAuthActionTokens.expiresAt, now)
        )
      )
      .returning({ userId: registryAuthActionTokens.userId });
    if (!consumed) return { ok: false, reason: 'invalid_or_expired_token' };

    const [user] = await tx
      .update(registryUsers)
      .set({
        passwordHash,
        status: 'active',
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(and(eq(registryUsers.id, consumed.userId), eq(registryUsers.status, 'invited')))
      .returning();
    return user ? { ok: true, user: toRegistryUser(user) } : { ok: false, reason: 'invalid_or_expired_token' };
  });
};

/**
 * Enumeration-safe reset request. The token is returned only to the trusted mail-delivery caller;
 * unknown/inactive emails return the same successful shape with a null token.
 */
export const createPasswordReset = async (
  db: RegistryDatabase,
  email: string,
  options: { now?: Date; expiresAt?: Date } = {}
): Promise<{ ok: true; user: RegistryUser | null; token: string | null; expiresAt: Date | null }> => {
  const normalizedEmail = normalizeEmail(email);
  const now = options.now ?? new Date();
  const expiresAt = options.expiresAt ?? new Date(now.getTime() + PASSWORD_RESET_LIFETIME_MS);
  return withRegistryTransaction(db, async (tx) => {
    const [user] = await tx
      .select()
      .from(registryUsers)
      .where(and(eq(registryUsers.email, normalizedEmail), eq(registryUsers.status, 'active')))
      .limit(1)
      .for('update');
    if (!user) return { ok: true, user: null, token: null, expiresAt: null };

    await invalidateUnusedActionTokens(tx, user.id, 'password_reset', now);
    const token = await insertActionToken(tx, user.id, 'password_reset', expiresAt, now);
    return { ok: true, user: toRegistryUser(user), token, expiresAt };
  });
};

export const resetPassword = async (
  db: RegistryDatabase,
  input: { token: string; password: string; now?: Date }
): Promise<ConsumeAuthActionResult> => {
  const validation = validatePassword(input.password);
  if ('error' in validation) return { ok: false, reason: 'invalid_password', error: validation.error };
  const passwordHash = await hashPassword(input.password);
  const now = input.now ?? new Date();

  return withRegistryTransaction(db, async (tx) => {
    const [consumed] = await tx
      .update(registryAuthActionTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(registryAuthActionTokens.tokenHash, hashSecret(input.token)),
          eq(registryAuthActionTokens.purpose, 'password_reset'),
          isNull(registryAuthActionTokens.usedAt),
          gt(registryAuthActionTokens.expiresAt, now)
        )
      )
      .returning({ userId: registryAuthActionTokens.userId });
    if (!consumed) return { ok: false, reason: 'invalid_or_expired_token' };

    const [user] = await tx
      .update(registryUsers)
      .set({
        passwordHash,
        authVersion: sql`${registryUsers.authVersion} + 1`,
        updatedAt: now,
      })
      .where(and(eq(registryUsers.id, consumed.userId), eq(registryUsers.status, 'active')))
      .returning();
    if (!user) return { ok: false, reason: 'invalid_or_expired_token' };
    await revokeAllRegistryAccessTokens(tx, user.id, now);
    return { ok: true, user: toRegistryUser(user) };
  });
};
