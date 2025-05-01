import archiver from 'archiver';
import fs from 'fs-extra';
import sortedUniq from 'lodash/sortedUniq';
import * as stream from 'node:stream';
import path from 'path';
import Handoff from '../../index';
import { DocumentationObject } from '../../types';
import { FontFamily } from './types';

/**
 * Zips the contents of a directory and writes the resulting archive to a writable stream.
 *
 * @param dirPath - The path to the directory whose contents will be zipped.
 * @param destination - A writable stream where the zip archive will be written.
 * @returns A Promise that resolves with the destination stream when the archive has been finalized.
 * @throws Will throw an error if the archiving process fails.
 */
const zip = async (dirPath: string, destination: stream.Writable): Promise<stream.Writable> => {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Set up event handlers
    archive.on('error', reject);
    destination.on('error', reject);

    // When the destination closes, resolve the promise
    destination.on('close', () => resolve(destination));

    archive.pipe(destination);

    fs.readdir(dirPath)
      .then((fontDir) => {
        for (const file of fontDir) {
          const filePath = path.join(dirPath, file);
          archive.append(fs.createReadStream(filePath), { name: path.basename(file) });
        }
        return archive.finalize();
      })
      .catch(reject);
  });
};

/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
export default async function fontTransformer(handoff: Handoff, documentationObject: DocumentationObject) {
  const { design } = documentationObject;
  const fontLocation = path.join(handoff?.workingPath, 'fonts');
  const families: FontFamily = design.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily]
        ? // sorts and returns unique font weights
          sortedUniq([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
        : [current.values.fontWeight],
    };
  }, {} as FontFamily);

  Object.keys(families).map(async (key) => {
    const name = key.replace(/\s/g, '');
    const fontDirName = path.join(fontLocation, name);
    if (fs.existsSync(fontDirName)) {
      const stream = fs.createWriteStream(path.join(fontLocation, `${name}.zip`));
      await zip(fontDirName, stream);
      const fontsFolder = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'fonts');
      if (!fs.existsSync(fontsFolder)) {
        fs.mkdirSync(fontsFolder);
      }
      fs.copySync(fontDirName, fontsFolder);
    }
  });
}
