import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const hashSecret = (secret: string): string => createHash('sha256').update(secret, 'utf8').digest('hex');

export const createOpaqueSecret = (byteLength = 32): string => randomBytes(byteLength).toString('base64url');

export const secretHashMatches = (secret: string, expectedHash: string): boolean => {
  const actual = Buffer.from(hashSecret(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Env var holding the deployment secret that reader-supplied AI keys are encrypted with. */
export const AI_KEY_SECRET_ENV = 'HANDOFF_AI_KEY_SECRET';

/** Shortest secret worth accepting. Matches the guidance the installer gives for `AUTH_SECRET`. */
const MIN_KEY_SECRET_LENGTH = 32;

/** Format marker, so a later algorithm is distinguishable from this one rather than guessed at. */
const ENCRYPTED_SECRET_VERSION = 'v1';

/** Thrown when a key must be encrypted but the deployment secret is missing or too short. */
export class MissingEncryptionSecretError extends Error {
  constructor() {
    super(
      `Reader-supplied AI keys cannot be stored because ${AI_KEY_SECRET_ENV} is not set. Set it to a ` +
        `random value of at least ${MIN_KEY_SECRET_LENGTH} characters, or declare no connection with ` +
        `"credential: 'user'".`
    );
    this.name = 'MissingEncryptionSecretError';
  }
}

/**
 * Derive the record key. A per-record salt means two rows holding the same provider key produce
 * different ciphertexts, and the fixed `info` label keeps this key distinct from anything else the
 * same secret is ever used for.
 */
const deriveKey = (salt: Buffer): Buffer => {
  const secret = process.env[AI_KEY_SECRET_ENV]?.trim();
  if (!secret || secret.length < MIN_KEY_SECRET_LENGTH) throw new MissingEncryptionSecretError();
  return Buffer.from(hkdfSync('sha256', Buffer.from(secret, 'utf8'), salt, 'handoff-ai-key', 32));
};

/**
 * Encrypt a value that has to be read back, such as a reader's provider key. AES-256-GCM, with the
 * salt, nonce and authentication tag carried in the payload so a row is self-describing.
 */
export const encryptSecret = (plaintext: string): string => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(salt), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const parts = [salt, iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url'));
  return [ENCRYPTED_SECRET_VERSION, ...parts].join('.');
};

/**
 * Decrypt a value written by {@link encryptSecret}. Returns `null` for anything that does not
 * authenticate — a payload in another format, or one written under a secret that has since been
 * rotated — so a stale row reads as "no key saved" instead of failing the request.
 */
export const decryptSecret = (payload: string): string | null => {
  const [version, salt, iv, tag, encrypted] = payload.split('.');
  if (version !== ENCRYPTED_SECRET_VERSION || !salt || !iv || !tag || !encrypted) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(Buffer.from(salt, 'base64url')), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};
