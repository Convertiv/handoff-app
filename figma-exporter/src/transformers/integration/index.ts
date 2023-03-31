import chalk from 'chalk';
import { DocumentationObject } from '../../types';
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import * as stream from 'node:stream';
import { getPathToIntegration } from '../../utils';

/**
 * Copy a selected integration
 */
export default async function integrationTransformer(integration: DocumentationObject): Promise<string> {
  const integrationLocation = path.resolve(path.join(getPathToIntegration(), 'sass'));
  const templateLocation = path.resolve(path.join(getPathToIntegration(), 'templates'));
  const targetDir = path.resolve(path.join('exported', 'framework_integration'));
  const templateDir = path.resolve(path.join('templates'));
  console.log(templateLocation)
  console.log(templateDir)
  if (fs.existsSync(integrationLocation)) {
    // TODO What integration should be loged
    console.log(chalk.green(`Found a framework integration`));
    // Copy the template into the destination

    fs.cpSync(integrationLocation, targetDir, { recursive: true });
    fs.cpSync(templateLocation, templateDir, { recursive: true });
    zipIntegration
  }

  return '';
}

/**
 * Zip the integration and tokens
 * @param dirPath
 * @param destination
 * @returns
 */
export const zipIntegration = async (dirPath: string, destination: stream.Writable) => {
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
