import { and, eq, gt, lt } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import type { RegistryDatabase } from '../db/client';
import { registryDeviceAuthorizations, registryUsers } from '../db/schema';
import {
  createRegistryAccessToken,
  normalizeRegistryScopes,
  registryRoleAllowsScopes,
  type RegistryAccessTokenSummary,
} from './access-tokens';
import { hashSecret } from './crypto';
import { withRegistryTransaction } from './database';
import { scopesForRegistryRole, type RegistryAccessScope, type RegistryUser } from './types';
import { toRegistryUser } from './user-record';

const USER_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
export const DEVICE_AUTHORIZATION_LIFETIME_SECONDS = 15 * 60;
export const DEVICE_AUTHORIZATION_POLL_INTERVAL_SECONDS = 5;

const randomUserCodeSegment = (length: number): string => {
  const bytes = randomBytes(length);
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += USER_CODE_ALPHABET[bytes[index] % USER_CODE_ALPHABET.length];
  }
  return result;
};

export const generateRegistryUserCode = (): string => `${randomUserCodeSegment(4)}-${randomUserCodeSegment(4)}`;

export const normalizeRegistryUserCode = (value: string): string => {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return compact.length === 8 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : value.trim().toUpperCase();
};

export interface CreateRegistryDeviceAuthorizationResult {
  deviceCode: string;
  userCode: string;
  expiresIn: number;
  interval: number;
  expiresAt: Date;
}

export const createRegistryDeviceAuthorization = async (
  db: RegistryDatabase,
  options: { now?: Date; expiresInSeconds?: number } = {}
): Promise<CreateRegistryDeviceAuthorizationResult> => {
  const now = options.now ?? new Date();
  const expiresIn = options.expiresInSeconds ?? DEVICE_AUTHORIZATION_LIFETIME_SECONDS;
  const deviceCode = randomBytes(32).toString('base64url');
  const userCode = generateRegistryUserCode();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  await db.insert(registryDeviceAuthorizations).values({
    id: randomUUID(),
    deviceCodeHash: hashSecret(deviceCode),
    userCode,
    status: 'pending',
    scopes: [],
    expiresAt,
    createdAt: now,
  });
  return {
    deviceCode,
    userCode,
    expiresIn,
    interval: DEVICE_AUTHORIZATION_POLL_INTERVAL_SECONDS,
    expiresAt,
  };
};

export type RegistryDeviceApprovalResult =
  | { ok: true; user: RegistryUser; scopes: RegistryAccessScope[] }
  | { ok: false; reason: 'invalid_or_expired_code' | 'user_inactive' };

export const approveRegistryDeviceAuthorization = async (
  db: RegistryDatabase,
  input: { userCode: string; userId: string; now?: Date }
): Promise<RegistryDeviceApprovalResult> => {
  const now = input.now ?? new Date();
  const [user] = await db.select().from(registryUsers).where(eq(registryUsers.id, input.userId)).limit(1);
  if (!user || user.status !== 'active') return { ok: false, reason: 'user_inactive' };

  const scopes = scopesForRegistryRole(user.role);
  const [authorization] = await db
    .update(registryDeviceAuthorizations)
    .set({
      status: 'approved',
      userId: user.id,
      scopes,
      approvedAt: now,
    })
    .where(
      and(
        eq(registryDeviceAuthorizations.userCode, normalizeRegistryUserCode(input.userCode)),
        eq(registryDeviceAuthorizations.status, 'pending'),
        gt(registryDeviceAuthorizations.expiresAt, now)
      )
    )
    .returning({ id: registryDeviceAuthorizations.id });
  return authorization ? { ok: true, user: toRegistryUser(user), scopes } : { ok: false, reason: 'invalid_or_expired_code' };
};

export const denyRegistryDeviceAuthorization = async (db: RegistryDatabase, userCode: string, now = new Date()): Promise<boolean> => {
  const rows = await db
    .update(registryDeviceAuthorizations)
    .set({ status: 'denied' })
    .where(
      and(
        eq(registryDeviceAuthorizations.userCode, normalizeRegistryUserCode(userCode)),
        eq(registryDeviceAuthorizations.status, 'pending'),
        gt(registryDeviceAuthorizations.expiresAt, now)
      )
    )
    .returning({ id: registryDeviceAuthorizations.id });
  return rows.length > 0;
};

export type ExchangeRegistryDeviceAuthorizationResult =
  | {
      ok: true;
      accessToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
      scopes: RegistryAccessScope[];
      user: RegistryUser;
      record: RegistryAccessTokenSummary;
    }
  | {
      ok: false;
      error: 'invalid_grant' | 'expired_token' | 'authorization_pending' | 'access_denied';
      errorDescription: string;
    };

export const exchangeRegistryDeviceAuthorization = async (
  db: RegistryDatabase,
  input: { deviceCode: string; tokenName?: string; now?: Date }
): Promise<ExchangeRegistryDeviceAuthorizationResult> => {
  const now = input.now ?? new Date();
  const tokenName = input.tokenName?.trim() || 'Handoff CLI';

  return withRegistryTransaction(db, async (tx) => {
    const [authorization] = await tx
      .select()
      .from(registryDeviceAuthorizations)
      .where(eq(registryDeviceAuthorizations.deviceCodeHash, hashSecret(input.deviceCode)))
      .limit(1);
    if (!authorization) {
      return { ok: false, error: 'invalid_grant', errorDescription: 'Unknown device code.' };
    }
    if (authorization.expiresAt <= now) {
      return { ok: false, error: 'expired_token', errorDescription: 'Device authorization expired.' };
    }
    if (authorization.status === 'pending') {
      return {
        ok: false,
        error: 'authorization_pending',
        errorDescription: 'The authorization request is still pending.',
      };
    }
    if (authorization.status === 'denied') {
      return { ok: false, error: 'access_denied', errorDescription: 'The authorization request was denied.' };
    }
    if (authorization.status === 'consumed') {
      return { ok: false, error: 'invalid_grant', errorDescription: 'Device code has already been used.' };
    }
    if (!authorization.userId) {
      return { ok: false, error: 'invalid_grant', errorDescription: 'Device authorization has no user.' };
    }

    const [consumed] = await tx
      .update(registryDeviceAuthorizations)
      .set({ status: 'consumed', consumedAt: now })
      .where(
        and(
          eq(registryDeviceAuthorizations.id, authorization.id),
          eq(registryDeviceAuthorizations.status, 'approved'),
          gt(registryDeviceAuthorizations.expiresAt, now)
        )
      )
      .returning({ id: registryDeviceAuthorizations.id });
    if (!consumed) {
      return { ok: false, error: 'invalid_grant', errorDescription: 'Device code has already been used.' };
    }

    const [user] = await tx.select().from(registryUsers).where(eq(registryUsers.id, authorization.userId)).limit(1);
    if (!user || user.status !== 'active') {
      return { ok: false, error: 'access_denied', errorDescription: 'The approving account is inactive.' };
    }

    let scopes = normalizeRegistryScopes(authorization.scopes);
    if (!registryRoleAllowsScopes(user.role, scopes)) scopes = scopesForRegistryRole(user.role);
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const token = await createRegistryAccessToken(tx, {
      userId: user.id,
      name: tokenName,
      scopes,
      expiresAt,
      now,
    });
    if (!token.ok) {
      return { ok: false, error: 'access_denied', errorDescription: 'The account cannot issue this token.' };
    }

    return {
      ok: true,
      accessToken: token.token,
      tokenType: 'Bearer',
      expiresIn: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      scopes: token.record.scopes,
      user: toRegistryUser(user),
      record: token.record,
    };
  });
};

export const purgeExpiredRegistryDeviceAuthorizations = async (db: RegistryDatabase, now = new Date()): Promise<number> => {
  const rows = await db
    .delete(registryDeviceAuthorizations)
    .where(lt(registryDeviceAuthorizations.expiresAt, now))
    .returning({ id: registryDeviceAuthorizations.id });
  return rows.length;
};
