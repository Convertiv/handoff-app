import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handoff, { initIntegrationObject } from '../../../index';
import { bundleJSWebpack } from '../../../utils/preview';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

const buildComponentJs = async (data: TransformComponentTokensResult, handoff: Handoff): Promise<TransformComponentTokensResult> => {
  const id = data.id;
  const entry = data.entries?.js;

  if (!entry) {
    return data;
  }

  // Is there a JS file with the same name?
  const outputPath = getComponentOutputPath(handoff);
  if (fs.existsSync(path.resolve(entry))) {
    try {
      const js = await fs.readFile(entry, 'utf8');
      const compiled = await bundleJSWebpack(entry, handoff, 'production');
      if (js) {
        data.js = js;
        data['jsCompiled'] = compiled;
        await fs.writeFile(path.resolve(outputPath, path.basename(entry)), compiled);
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling JS for ${id}`));
      console.log(e);
    }
  }
  return data;
};

/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
export const buildMainJS = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const integration = initIntegrationObject(handoff)[0];
  if (integration && integration.entries.bundle && fs.existsSync(path.resolve(integration.entries.bundle))) {
    console.log(chalk.green(`Detected main JS file`));
    try {
      const jsPath = path.resolve(integration.entries.bundle);
      const compiled = await bundleJSWebpack(jsPath, handoff, 'production');
      await fs.writeFile(path.resolve(outputPath, 'main.js'), compiled);
    } catch (e) {
      console.log(chalk.red(`Error compiling main JS`));
      console.log(e);
    }
  }
};

export default buildComponentJs;
