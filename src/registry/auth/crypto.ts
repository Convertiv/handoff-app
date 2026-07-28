import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const hashSecret = (secret: string): string => createHash('sha256').update(secret, 'utf8').digest('hex');

export const createOpaqueSecret = (byteLength = 32): string => randomBytes(byteLength).toString('base64url');

export const secretHashMatches = (secret: string, expectedHash: string): boolean => {
  const actual = Buffer.from(hashSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
