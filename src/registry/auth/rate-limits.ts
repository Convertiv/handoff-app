import { and, eq, lt, sql } from 'drizzle-orm';
import type { RegistryDatabase } from '../db/client';
import { registryAuthRateLimits, type RegistryRateLimitBucket } from '../db/schema';
import { hashSecret } from './crypto';

export interface ConsumeAuthRateLimitInput {
  bucket: RegistryRateLimitBucket;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: Date;
}

export interface AuthRateLimitResult {
  allowed: boolean;
  attempts: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
  retryAfterSeconds: number;
}

export const hashRateLimitIdentifier = (bucket: RegistryRateLimitBucket, identifier: string): string =>
  hashSecret(`${bucket}:${identifier.trim().toLowerCase()}`);

/** Atomic fixed-window counter shared by all registry instances. */
export const consumeAuthRateLimit = async (db: RegistryDatabase, input: ConsumeAuthRateLimitInput): Promise<AuthRateLimitResult> => {
  if (!Number.isInteger(input.limit) || input.limit < 1) throw new Error('Rate-limit limit must be a positive integer.');
  if (!Number.isInteger(input.windowMs) || input.windowMs < 1) {
    throw new Error('Rate-limit windowMs must be a positive integer.');
  }

  const now = input.now ?? new Date();
  const windowStartedAt = new Date(Math.floor(now.getTime() / input.windowMs) * input.windowMs);
  const resetsAt = new Date(windowStartedAt.getTime() + input.windowMs);
  const identifierHash = hashRateLimitIdentifier(input.bucket, input.identifier);
  const [counter] = await db
    .insert(registryAuthRateLimits)
    .values({
      bucket: input.bucket,
      identifierHash,
      windowStartedAt,
      attempts: 1,
      expiresAt: resetsAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [registryAuthRateLimits.bucket, registryAuthRateLimits.identifierHash, registryAuthRateLimits.windowStartedAt],
      set: {
        attempts: sql`${registryAuthRateLimits.attempts} + 1`,
        expiresAt: resetsAt,
        updatedAt: now,
      },
    })
    .returning({ attempts: registryAuthRateLimits.attempts });

  const attempts = counter.attempts;
  return {
    allowed: attempts <= input.limit,
    attempts,
    limit: input.limit,
    remaining: Math.max(0, input.limit - attempts),
    resetsAt,
    retryAfterSeconds: attempts > input.limit ? Math.max(1, Math.ceil((resetsAt.getTime() - now.getTime()) / 1000)) : 0,
  };
};

export const clearAuthRateLimit = async (db: RegistryDatabase, bucket: RegistryRateLimitBucket, identifier: string): Promise<number> => {
  const rows = await db
    .delete(registryAuthRateLimits)
    .where(
      and(eq(registryAuthRateLimits.bucket, bucket), eq(registryAuthRateLimits.identifierHash, hashRateLimitIdentifier(bucket, identifier)))
    )
    .returning({ identifierHash: registryAuthRateLimits.identifierHash });
  return rows.length;
};

export const purgeExpiredAuthRateLimits = async (db: RegistryDatabase, now = new Date()): Promise<number> => {
  const rows = await db
    .delete(registryAuthRateLimits)
    .where(lt(registryAuthRateLimits.expiresAt, now))
    .returning({ identifierHash: registryAuthRateLimits.identifierHash });
  return rows.length;
};
