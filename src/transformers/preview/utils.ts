import path from 'path';
import fs from 'fs-extra';
import Handoff from '../../index.js';

/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
export const getComponentTemplate = async (handoff: Handoff, component: string, parts: string[]): Promise<string | null> => {
  // [override, local]
  const sources = [path.resolve(handoff.workingPath, `integration/templates/${component}`), path.resolve(__dirname, `../../templates/${component}`)];

  for (const src of sources) {
    let cwd: string = src;
    let srcParts = [...parts];
    let templatePath: string = undefined;

    while (srcParts.length > 0) {
      let pathToDir = path.resolve(cwd, srcParts[0]);
      let pathToFile = path.resolve(cwd, `${srcParts[0]}.html`);

      if (fs.pathExistsSync(pathToFile)) {
        templatePath = pathToFile;
      }

      if (fs.pathExistsSync(pathToDir)) {
        cwd = pathToDir;
      } else if (templatePath) {
        break;
      }

      srcParts.shift();
    }

    if (templatePath) {
      return await fs.readFile(templatePath, 'utf8');
    }
  }

  for (const src of sources) {
    const templatePath = path.resolve(src, `default.html`)

    if (await fs.pathExists(templatePath)) {
      return await fs.readFile(templatePath, 'utf8');
    }
  }

  return null;
};
