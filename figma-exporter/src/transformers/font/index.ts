import chalk from 'chalk';
import { DocumentationObject } from '../../types';
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import sortedUniq from 'lodash/sortedUniq';
import * as stream from 'node:stream';
import { FontFamily } from './types';

/**
 * Transforms the documentation object components into a preview and code
 */
export default async function fontTransformer(documentationObject: DocumentationObject) {
  const { design } = documentationObject;
  const outputFolder = 'public';
  const fontLocation = path.join(outputFolder, 'fonts');
  const families: FontFamily = design.typography.reduce((result, current) => {
    return {
      ...result,
      [current.values.fontFamily]: result[current.values.fontFamily]
        ? // sorts and returns unique font weights
          sortedUniq([...result[current.values.fontFamily], current.values.fontWeight].sort((a, b) => a - b))
        : [current.values.fontWeight],
    };
  }, {} as FontFamily);
  const customFonts: string[] = [];

  Object.keys(families).map(async (key) => {
    //
    const name = key.replace(/\s/g, '');
    const fontDirName = path.join(fontLocation, name);
    if (fs.existsSync(fontDirName)) {
      console.log(chalk.green(`Found a custom font ${name}`));
      // Ok, we've found a custom font at this location
      // Zip the font up and put the zip in the font location
      const stream = fs.createWriteStream(path.join(fontLocation, `${name}.zip`));
      await zipFonts(fontDirName, stream);
      customFonts.push(`${name}.zip`);
    }
  });

  return customFonts;
}

export const zipFonts = async (dirPath: string, destination: stream.Writable) => {
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(destination);
  const fontDir = await fs.readdir(dirPath);
  for (const file of fontDir) {
    const data = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    archive.append(data, { name: path.basename(file) });
  }
  await archive.finalize();

  return destination;
};
