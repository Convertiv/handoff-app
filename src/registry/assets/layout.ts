/**
 * Workspace physical layout for asset logical paths.
 *
 * A collection's logical paths are portable (no project id): icon/logo bodies + the collection JSON +
 * the sprite live under `public/api`, the downloadable ZIP archives live at the generated output
 * root, and font archives live under the workspace `fonts/` dir. Both the filesystem store (reading
 * for publish) and checkout (writing restored files) resolve through this one mapping so they never
 * drift.
 */

import { isSafeRelativePath, resolvePathWithin } from '../path';

/** The absolute roots a logical asset path can resolve against. */
export interface AssetPhysicalRoots {
  /** `<workingPath>/public/api`: icon/logo bodies, collection JSON, sprite + manifest. */
  apiPath: string;
  /** Absolute path of `icons.zip` (`Handoff.getIconsZipFilePath()`). */
  iconsZip: string;
  /** Absolute path of `logos.zip` (`Handoff.getLogosZipFilePath()`). */
  logosZip: string;
  /** Workspace root, holding the `fonts/` dir. */
  workingPath: string;
}

/** Resolve a collection-relative logical asset path to its absolute workspace location. */
export const resolveAssetPhysicalPath = (logicalPath: string, roots: AssetPhysicalRoots): string => {
  if (!isSafeRelativePath(logicalPath)) {
    throw new Error(`Unsafe asset path "${logicalPath}".`);
  }
  if (logicalPath === 'icons.zip') return roots.iconsZip;
  if (logicalPath === 'logos.zip') return roots.logosZip;
  const root = logicalPath.startsWith('fonts/') ? roots.workingPath : roots.apiPath;
  const resolved = resolvePathWithin(root, logicalPath);
  if (!resolved) {
    throw new Error(`Asset path "${logicalPath}" escapes its workspace root.`);
  }
  return resolved;
};
