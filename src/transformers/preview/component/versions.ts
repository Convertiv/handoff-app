import fs from 'fs';
import path from 'path';
import semver from 'semver';
import Handoff from '../../../index';
import { getComponentPath } from '../component';

const getVersionsForComponent = async (handoff: Handoff, id: string): Promise<string[]> => {
  const componentPath = path.resolve(getComponentPath(handoff), id);
  const versionDirectories = fs.readdirSync(componentPath);
  const versions: string[] = [];
  // The directory name must be a semver
  if (fs.lstatSync(componentPath).isDirectory()) {
    // this is a directory structure.  this should be the component name,
    // and each directory inside should be a version
    for (const versionDirectory of versionDirectories) {
      if (semver.valid(versionDirectory)) {
        const versionFiles = fs.readdirSync(path.resolve(componentPath, versionDirectory));
        for (const versionFile of versionFiles) {
          if (versionFile.endsWith('.hbs')) {
            versions.push(versionDirectory);
            break;
          }
        }
      } else {
        console.error(`Invalid version directory ${versionDirectory}`);
      }
    }
  }
  versions.sort(semver.rcompare);
  return versions;
};

export const getLatestVersionForComponent = (versions: string[]): string => versions.sort(semver.rcompare)[0];

export default getVersionsForComponent;
