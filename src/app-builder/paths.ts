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

const mirrorDirectory = async (sourcePath: string, destinationPath: string): Promise<void> => {
  if (!(await fs.pathExists(sourcePath))) {
    await fs.remove(destinationPath);
    return;
  }

  await fs.remove(destinationPath);
  await fs.ensureDir(path.dirname(destinationPath));
  await fs.copy(sourcePath, destinationPath, { overwrite: true });
};

/**
 * Copy the fetch-produced asset bundles (`exported/<id>/{collection}.zip`) into the app's public
 * root, where the docs read API serves them at `/api/docs/assets/{collection}/{collection}.zip`.
 * `fetch` writes these bundles, but `build`/`start` cleans and re-stages `.handoff` without them, so
 * the download links 404 until the next fetch. Copying them here keeps the route working in workspace
 * dev and static builds. Projects with no logos/icons have no bundles, so those are skipped.
 */
const stageAssetDownloadBundles = async (handoff: Handoff, destinationPublicPath: string): Promise<void> => {
  const bundles: Array<{ src: string; name: string }> = [
    { src: handoff.getLogosZipFilePath(), name: 'logos.zip' },
    { src: handoff.getIconsZipFilePath(), name: 'icons.zip' },
  ];
  for (const { src, name } of bundles) {
    if (fs.existsSync(src) && fs.statSync(src).isFile()) {
      await fs.ensureDir(destinationPublicPath);
      await fs.copy(src, path.resolve(destinationPublicPath, name), { overwrite: true });
    }
  }
};

/**
 * Copy the public dir from the working dir to the module dir.
 */
export const syncPublicFiles = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const destinationPublicPath = path.resolve(appPath, 'public');
  const workingPublicPath = getWorkingPublicPath(handoff);
  if (workingPublicPath) {
    const sourceApiPath = path.resolve(workingPublicPath, 'api');
    const destinationApiPath = path.resolve(destinationPublicPath, 'api');

    await fs.copy(workingPublicPath, destinationPublicPath, {
      overwrite: true,
      filter: (file) => {
        const relativePath = path.relative(workingPublicPath, file);
        return relativePath !== 'api' && !relativePath.startsWith(`api${path.sep}`);
      },
    });

    await mirrorDirectory(sourceApiPath, destinationApiPath);
  }

  // Stage the asset bundles even when the workspace has no `public/` dir; they come from the fetch
  // output, not the workspace public tree.
  await stageAssetDownloadBundles(handoff, destinationPublicPath);
};
