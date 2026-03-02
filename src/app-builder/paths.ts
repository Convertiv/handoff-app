import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';

/**
 * Gets the working public directory path for a given handoff instance.
 * Checks for both project-specific and default public directories.
 *
 * @param handoff - The handoff instance containing working path and figma project configuration
 * @returns The resolved path to the public directory if it exists, null otherwise
 */
export const getWorkingPublicPath = (handoff: Handoff): string | null => {
  const paths = [path.resolve(handoff.workingPath, `public-${handoff.getProjectId()}`), path.resolve(handoff.workingPath, `public`)];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
};

/**
 * Gets the application path for a given handoff instance.
 * @param handoff - The handoff instance containing module path and figma project configuration
 * @returns The resolved path to the application directory
 */
export const getAppPath = (handoff: Handoff): string => {
  return path.resolve(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`);
};

/**
 * Copy the public dir from the working dir to the module dir.
 */
export const syncPublicFiles = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const workingPublicPath = getWorkingPublicPath(handoff);
  if (workingPublicPath) {
    await fs.copy(workingPublicPath, path.resolve(appPath, 'public'), {
      overwrite: true,
    });
  }
};
