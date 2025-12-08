import fs from 'fs-extra';
import path from 'path';

/**
 * Represents the state of a file for change detection
 */
export interface FileState {
  /** File modification time in milliseconds */
  mtime: number;
  /** File size in bytes */
  size: number;
}

/**
 * Computes the current state (mtime, size) of a file
 * @param filePath - Absolute path to the file
 * @returns FileState if file exists, null otherwise
 */
export async function computeFileState(filePath: string): Promise<FileState | null> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return null;
    }
    return {
      mtime: stats.mtimeMs,
      size: stats.size,
    };
  } catch {
    return null;
  }
}

/**
 * Computes file states for all files in a directory (recursively)
 * @param dirPath - Absolute path to the directory
 * @param extensions - Optional array of file extensions to include (e.g., ['.hbs', '.html'])
 * @returns Record mapping relative file paths to their states
 */
export async function computeDirectoryState(dirPath: string, extensions?: string[]): Promise<Record<string, FileState>> {
  const result: Record<string, FileState> = {};

  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return result;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        const subDirStates = await computeDirectoryState(fullPath, extensions);
        for (const [subPath, state] of Object.entries(subDirStates)) {
          result[path.join(entry.name, subPath)] = state;
        }
      } else if (entry.isFile()) {
        // Check extension filter if provided
        if (extensions && extensions.length > 0) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!extensions.includes(ext)) {
            continue;
          }
        }

        const fileState = await computeFileState(fullPath);
        if (fileState) {
          result[entry.name] = fileState;
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return result;
}

/**
 * Compares two file states for equality
 * @param a - First file state (can be null/undefined)
 * @param b - Second file state (can be null/undefined)
 * @returns true if states match, false otherwise
 */
export function statesMatch(a: FileState | null | undefined, b: FileState | null | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.mtime === b.mtime && a.size === b.size;
}

/**
 * Compares two records of file states
 * @param cached - Previously cached file states
 * @param current - Current file states
 * @returns true if all states match, false if any differ or files added/removed
 */
export function directoryStatesMatch(
  cached: Record<string, FileState> | null | undefined,
  current: Record<string, FileState> | null | undefined
): boolean {
  if (!cached && !current) return true;
  if (!cached || !current) return false;

  const cachedKeys = Object.keys(cached);
  const currentKeys = Object.keys(current);

  // Check if file count differs
  if (cachedKeys.length !== currentKeys.length) {
    return false;
  }

  // Check if any files were added or removed
  const cachedSet = new Set(cachedKeys);
  for (const key of currentKeys) {
    if (!cachedSet.has(key)) {
      return false;
    }
  }

  // Check if any file states changed
  for (const key of cachedKeys) {
    if (!statesMatch(cached[key], current[key])) {
      return false;
    }
  }

  return true;
}
