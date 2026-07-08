/**
 * Workspace physical layout for asset logical paths.
 *
 * A collection's logical paths are portable (no project id): icon/logo bodies + the collection JSON +
 * the sprite live under `public/api`, the downloadable ZIP archives live at the generated output
 * root, and font archives live under the workspace `fonts/` dir. Both the filesystem store (reading
 * for publish) and checkout (writing restored files) resolve through this one mapping so they never
 * drift.
 */

import path from 'path';

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
  if (logicalPath === 'icons.zip') return roots.iconsZip;
  if (logicalPath === 'logos.zip') return roots.logosZip;
  const segments = logicalPath.split('/');
  if (segments[0] === 'fonts') return path.resolve(roots.workingPath, ...segments);
  return path.resolve(roots.apiPath, ...segments);
};
