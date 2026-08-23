import { normalizeEmail } from './crypto';

const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Printable ASCII (`!` through `~`) except the comma: HTTP's `VCHAR`, minus the character Node joins
 * duplicate header values with.
 */
const TRANSMITTABLE_CREDENTIAL_PATTERN = /^[\x21-\x2B\x2D-\x7E]+$/;

/**
 * Whether a credential can be presented unambiguously in a request header. One rule shared by the
 * authentication headers and by whatever a deployment configures as a secret, so a value is never
 * accepted through one carrier and rejected by the other.
 *
 * Whitespace is out so nothing can be trimmed away or smuggled past a parser, and the comma with it:
 * repeats of a header Node does not de-duplicate arrive joined with `, `, and no accepted credential
 * may look like that. Non-ASCII bytes are out too, since their header encoding is ambiguous and a
 * credential has to reproduce exactly.
 */
export const isTransmittableCredential = (value: string): boolean => TRANSMITTABLE_CREDENTIAL_PATTERN.test(value);

export const validateRegistryEmail = (email: string): string | null => {
  const normalized = normalizeEmail(email);
  return normalized.length <= 320 && SIMPLE_EMAIL_PATTERN.test(normalized) ? normalized : null;
};

export const validateRegistryDisplayName = (name: string): string | null => {
  const normalized = name.trim();
  return normalized && normalized.length <= 120 ? normalized : null;
};

export const validateRegistryImageUrl = (image: string | null | undefined): string | null | false => {
  const normalized = image?.trim();
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'https:' && normalized.length <= 2048 ? normalized : false;
  } catch {
    return false;
  }
};
