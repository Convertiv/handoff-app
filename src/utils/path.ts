import path from 'path';

/**
 * Generates a filesystem-safe directory name from an absolute path
 * @param workingPath - The absolute working path to transform
 * @returns A filesystem-safe string suitable for use as a directory name
 */
export function generateFilesystemSafeId(workingPath: string): string {
  // Normalize path separators to forward slashes for consistent processing
  let safeId = workingPath.replace(/\\/g, '/');
  
  // Replace forward slashes with dashes
  safeId = safeId.replace(/\//g, '-');
  
  // Remove or replace invalid filesystem characters
  safeId = safeId.replace(/[<>:"|?*\x00]/g, '-');
  
  // Remove leading/trailing dashes and spaces
  safeId = safeId.replace(/^[\s-]+|[\s-]+$/g, '');
  
  // Handle Windows reserved names (case-insensitive)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(safeId)) {
    safeId = `project-${safeId}`;
  }
  
  // Ensure we have at least one character
  if (!safeId) {
    safeId = 'default-project';
  }
  
  return safeId;
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
 * True when childPath is equal to or within parentPath.
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const normalizedChild = normalizePathForCompare(childPath);
  const normalizedParent = normalizePathForCompare(parentPath);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`);
}

