import path from 'path';

export const isSafeRelativePath = (value: string): boolean => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  const normalized = normalizeRelativePath(value);
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return false;
  }
  return normalized.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');
};

export const normalizeRelativePath = (value: string): string => value.replace(/\\/g, '/');

/** Unlike {@link isSafeRelativePath}, it can start with `../`. */
export const isWorkspaceRelativePath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value !== '' &&
  value !== '.' &&
  !value.includes('\0') &&
  !value.includes('\\') &&
  !value.startsWith('/') &&
  !/^[a-zA-Z]:/.test(value) &&
  path.posix.normalize(value) === value;

export const isSafePathSegment = (value: string): boolean =>
  typeof value === 'string' && value === value.trim() && isSafeRelativePath(value) && !normalizeRelativePath(value).includes('/');

export const resolvePathWithin = (root: string, value: string): string | null => {
  if (!isSafeRelativePath(value)) {
    return null;
  }
  const absolutePath = path.resolve(root, ...normalizeRelativePath(value).split('/'));
  const relativePath = path.relative(root, absolutePath);
  return relativePath.startsWith('..') || path.isAbsolute(relativePath) ? null : absolutePath;
};
