import { count, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { RegistryDatabase } from '../db/client';
import { registryInstallations, registryUsers } from '../db/schema';
import { acquireRegistryAdvisoryLock, REGISTRY_INSTALL_LOCK_ID, withRegistryTransaction } from './database';
import { hashPassword, validatePassword } from './password';
import type { RegistryUser } from './types';
import { toRegistryUser } from './user-record';
import { validateRegistryDisplayName, validateRegistryEmail } from './validation';

/** Migration number that introduced the registry authentication schema. */
export const REGISTRY_AUTH_SCHEMA_VERSION = 5;
export const REGISTRY_INSTALLATION_ID = 'default';

export type RegistryInstallation = typeof registryInstallations.$inferSelect;
export type RegistryInstallationState =
  | { status: 'ready'; installation: null; userCount: 0 }
  | { status: 'installed'; installation: RegistryInstallation; userCount: number }
  | { status: 'inconsistent'; installation: null; userCount: number };

export interface RegistryInstallInput {
  email: string;
  name: string;
  password: string;
  now?: Date;
}

export type RegistryInstallResult =
  | { ok: true; user: RegistryUser; installation: RegistryInstallation }
  | {
      ok: false;
      reason: 'invalid_email' | 'invalid_name' | 'invalid_password' | 'already_installed' | 'users_exist';
      error?: string;
    };

export const getRegistryInstallation = async (db: RegistryDatabase): Promise<RegistryInstallation | null> => {
  const [installation] = await db
    .select()
    .from(registryInstallations)
    .where(eq(registryInstallations.id, REGISTRY_INSTALLATION_ID))
    .limit(1);
  return installation ?? null;
};

export const getRegistryInstallationState = async (db: RegistryDatabase): Promise<RegistryInstallationState> => {
  const installation = await getRegistryInstallation(db);
  const [{ value }] = await db.select({ value: count() }).from(registryUsers);
  const userCount = Number(value);
  if (installation) return { status: 'installed', installation, userCount };
  return userCount === 0
    ? { status: 'ready', installation: null, userCount: 0 }
    : { status: 'inconsistent', installation: null, userCount };
};

/**
 * Complete first-visitor installation under a transaction-scoped advisory lock. Password hashing is
 * intentionally performed before taking the lock; all state checks are repeated inside it.
 */
export const installRegistry = async (db: RegistryDatabase, input: RegistryInstallInput): Promise<RegistryInstallResult> => {
  const email = validateRegistryEmail(input.email);
  if (!email) return { ok: false, reason: 'invalid_email' };
  const name = validateRegistryDisplayName(input.name);
  if (!name) return { ok: false, reason: 'invalid_name' };
  const passwordValidation = validatePassword(input.password);
  if ('error' in passwordValidation) {
    return { ok: false, reason: 'invalid_password', error: passwordValidation.error };
  }

  const passwordHash = await hashPassword(input.password);
  const now = input.now ?? new Date();

  return withRegistryTransaction(db, async (tx) => {
    await acquireRegistryAdvisoryLock(tx, REGISTRY_INSTALL_LOCK_ID);

    const [installation] = await tx
      .select()
      .from(registryInstallations)
      .where(eq(registryInstallations.id, REGISTRY_INSTALLATION_ID))
      .limit(1);
    if (installation) return { ok: false, reason: 'already_installed' };

    const [{ value }] = await tx.select({ value: count() }).from(registryUsers);
    if (Number(value) > 0) return { ok: false, reason: 'users_exist' };

    const userId = randomUUID();
    const [userRow] = await tx
      .insert(registryUsers)
      .values({
        id: userId,
        email,
        name,
        role: 'admin',
        status: 'active',
        passwordHash,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const [createdInstallation] = await tx
      .insert(registryInstallations)
      .values({
        id: REGISTRY_INSTALLATION_ID,
        status: 'installed',
        schemaVersion: REGISTRY_AUTH_SCHEMA_VERSION,
        initialAdminUserId: userId,
        installedAt: now,
      })
      .returning();

    return {
      ok: true,
      user: toRegistryUser(userRow),
      installation: createdInstallation,
    };
  });
};
