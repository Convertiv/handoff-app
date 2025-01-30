import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';

/**
 * A utility function to rename a component
 * @param handoff
 * @param source
 * @param destination
 */
export async function renameComponent(handoff: Handoff, source: string, destination: string) {
  source = path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'components', source);
  destination = path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'components', destination);
  ['hbs', 'js', 'scss', 'css'].forEach(async (ext) => {
    console.log(`Checking for ${source}.${ext}`);
    let test = source.includes(`.${ext}`) ? source : `${source}.${ext}`;
    if (fs.existsSync(test)) {
      await fs.rename(test, destination.includes(`.${ext}`) ? destination : `${destination}.${ext}`);
    }
  });

  // find any references to the old component in the pages and replace them with the new component id
  // const pagesPath = path.resolve(this.workingPath, 'integration/pages');
}
