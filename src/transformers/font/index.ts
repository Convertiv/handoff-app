import chalk from 'chalk';
import { DocumentationObject } from '../../types';
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import sortedUniq from 'lodash/sortedUniq';
import * as stream from 'node:stream';
import { FontFamily } from './types';
import Handoff from '../../index';

/**
 * Detect a font present in the public dir.  If it matches a font family from
 * figma, zip it up and make it avaliable in the config for use
 */
export default async function fontTransformer(handoff: Handoff, documentationObject: DocumentationObject) {
  const { design } = documentationObject;
  const outputFolder = 'public';
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
      const fontsFolder = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, handoff.config.integrationPath ?? 'integration', 'fonts');
      if(!fs.existsSync(fontsFolder)) {
        fs.mkdirSync(fontsFolder);
      }
      await fs.copySync(fontDirName, fontsFolder);
      customFonts.push(`${name}.zip`);
    }
  });
  //const hookReturn = (await pluginTransformer()).postFont(documentationObject, customFonts);
  //return hookReturn;
}

/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
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
