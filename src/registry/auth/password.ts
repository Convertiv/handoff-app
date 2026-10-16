import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const PASSWORD_HASH_VERSION = 'scrypt-v1';
const PASSWORD_KEY_LENGTH = 64;
export const MINIMUM_PASSWORD_LENGTH = 12;
export const MAXIMUM_PASSWORD_LENGTH = 1024;

export type PasswordValidationResult = { valid: true } | { valid: false; error: string };

export const validatePassword = (password: string): PasswordValidationResult => {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.` };
  }
  if (password.length > MAXIMUM_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at most ${MAXIMUM_PASSWORD_LENGTH} characters.` };
  }
  return { valid: true };
};

/** Versioned scrypt encoding: `scrypt-v1:<base64url salt>:<base64url derived key>`. */
export const hashPassword = async (password: string): Promise<string> => {
  const validation = validatePassword(password);
  if ('error' in validation) throw new Error(validation.error);

  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${PASSWORD_HASH_VERSION}:${salt.toString('base64url')}:${derived.toString('base64url')}`;
};

export const verifyPassword = async (password: string, encoded: string | null | undefined): Promise<boolean> => {
  if (!encoded || password.length > MAXIMUM_PASSWORD_LENGTH) return false;
  const [version, saltText, hashText, ...rest] = encoded.split(':');
  if (version !== PASSWORD_HASH_VERSION || !saltText || !hashText || rest.length) return false;

  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_LENGTH) return false;
    const actual = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};
