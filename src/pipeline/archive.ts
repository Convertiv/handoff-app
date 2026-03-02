import archiver from 'archiver';
import fs from 'fs-extra';
import { Types as HandoffTypes } from 'handoff-core';
import * as stream from 'node:stream';
import path from 'path';

/**
 * Read a JSON file, returning undefined if it can't be read.
 */
export const readPrevJSONFile = async (filePath: string) => {
  try {
    return await fs.readJSON(filePath);
  } catch (e) {
    return undefined;
  }
};

/**
 * Zips the contents of a directory and writes the resulting archive to a writable stream.
 *
 * @param dirPath - The path to the directory whose contents will be zipped.
 * @param destination - A writable stream where the zip archive will be written.
 * @returns A Promise that resolves with the destination stream when the archive has been finalized.
 * @throws Will throw an error if the archiving process fails.
 */
export const zip = async (dirPath: string, destination: stream.Writable): Promise<stream.Writable> => {
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
 * Zips an array of asset objects into a zip archive.
 */
export const zipAssets = async (assets: HandoffTypes.IAssetObject[], destination: stream.Writable) => {
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(destination);

  assets.forEach((asset) => {
    archive.append(asset.data, { name: asset.path });
  });

  await archive.finalize();

  return destination;
};
