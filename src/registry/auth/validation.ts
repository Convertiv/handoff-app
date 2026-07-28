import { normalizeEmail } from './crypto';

const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
