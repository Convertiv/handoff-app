import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { bundleJSWebpack } from '../../../utils/preview';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

const buildComponentJs = async (
  id: string,
  location: string,
  data: TransformComponentTokensResult,
  handoff: Handoff
): Promise<TransformComponentTokensResult> => {
  // Is there a JS file with the same name?
  const outputPath = getComponentOutputPath(handoff);
  const jsFile = id + '.js';
  if (fs.existsSync(path.resolve(location, jsFile))) {
    console.log(chalk.green(`Detected JS file for ${id}`));
    try {
      const jsPath = path.resolve(location, jsFile);
      const js = await fs.readFile(jsPath, 'utf8');
      const compiled = await bundleJSWebpack(jsPath, handoff, 'production');
      if (js) {
        data.js = js;
        data['jsCompiled'] = compiled;
        await fs.writeFile(path.resolve(outputPath, jsFile), compiled);
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling JS for ${id}`));
      console.log(e);
    }
  }
  return data;
};

export default buildComponentJs;
