import { hashSecret, normalizeEmail } from './crypto';

// Gravatar resolves an avatar from the SHA-256 hash of the trimmed, lowercased email.
// `d=identicon` guarantees a generated image renders even when the user has no Gravatar.
export const buildGravatarUrl = (email: string): string =>
  `https://www.gravatar.com/avatar/${hashSecret(normalizeEmail(email))}?d=identicon`;
