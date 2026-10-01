import { createHash } from 'crypto';
import path from 'path';

/** `<base name>-<path hash>`; the hash keeps directories with the same base name apart. */
export function generateFilesystemSafeId(workingPath: string): string {
  const baseName = path.basename(path.resolve(workingPath));
  const name = baseName.replace(/[^A-Za-z0-9._-]/g, '-').replace(/^[.-]+|[.-]+$/g, '') || 'project';
  const hash = createHash('sha256').update(normalizePathForCompare(workingPath)).digest('hex').slice(0, 8);
  return `${name}-${hash}`;
}

/**
 * Normalize a filesystem path for cross-platform string comparison.
 * - Resolves to absolute path
 * - Normalizes separators to forward slashes
 * - Lowercases on Windows where paths are case-insensitive
 */
export function normalizePathForCompare(inputPath: string): string {
  const normalized = path.resolve(inputPath).replace(/\\/g, '/');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

/**
 * True when both paths resolve to the same normalized filesystem path.
 */
export function arePathsEqual(pathA: string, pathB: string): boolean {
  return normalizePathForCompare(pathA) === normalizePathForCompare(pathB);
}

/**
 * The directory handoff commands run against - `HANDOFF_WORKING_PATH` when set, otherwise the
 * process working directory. Relative paths passed on the command line (e.g. `-c`) resolve from here.
 */
export function resolveWorkingPath(): string {
  const configured = process.env.HANDOFF_WORKING_PATH;
  return configured ? path.resolve(configured) : process.cwd();
}

/**
 * True when childPath is equal to or within parentPath.
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const normalizedChild = normalizePathForCompare(childPath);
  const normalizedParent = normalizePathForCompare(parentPath);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`);
}

