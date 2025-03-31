import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import sass from 'sass';
import Handoff, { initIntegrationObject } from '../../../index';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

const buildComponentCss = async (data: TransformComponentTokensResult, handoff: Handoff, sharedStyles: string) => {
  const id = data.id;
  const entry = data.entries?.scss;

  if (!entry) {
    return data;
  }

  const extension = path.extname(entry);

  if (!extension) {
    return data;
  }

  // Is there a scss file with the same name?
  const outputPath = getComponentOutputPath(handoff);

  if (extension === '.scss') {
    try {
      const result = await sass.compileAsync(entry, {
        loadPaths: [
          path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'sass'),
          path.resolve(handoff.workingPath, 'node_modules'),
          path.resolve(handoff.workingPath),
          path.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
        ],
      });
      if (result.css) {
        // @ts-ignore
        data['css'] = result.css;
        // Split the CSS into shared styles and component styles
        const splitCSS = data['css']?.split('/* COMPONENT STYLES*/');
        // If there are two parts, the first part is the shared styles
        if (splitCSS && splitCSS.length > 1) {
          data['css'] = splitCSS[1];
          data['sharedStyles'] = splitCSS[0];
          await fs.writeFile(path.resolve(outputPath, `shared.css`), data['sharedStyles']);
        } else {
          if (!sharedStyles) sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
          await fs.writeFile(path.resolve(outputPath, `shared.css`), sharedStyles);
        }
        await fs.writeFile(path.resolve(outputPath, path.basename(entry).replace('.scss', '.css')), data['css']);
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling SCSS for ${id}`));
      throw e;
    }
    const scss = await fs.readFile(entry, 'utf8');
    if (scss) {
      data['sass'] = scss;
    }
  }

  // Is there a css file with the same name?
  if (extension === 'css') {
    const css = await fs.readFile(path.resolve(entry), 'utf8');
    if (css) {
      data['css'] = css;
    }
  }
  return data;
};

/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
export const buildMainCss = async (handoff: Handoff): Promise<void> => {
  const outputPath = getComponentOutputPath(handoff);
  const integration = initIntegrationObject(handoff)[0];
  if (integration && integration.entries.integration && fs.existsSync(integration.entries.integration)) {
    const stat = await fs.stat(integration.entries.integration);
    const entryPath = stat.isDirectory() ? path.resolve(integration.entries.integration, 'main.scss') : integration.entries.integration;
    if (entryPath === integration.entries.integration || fs.existsSync(entryPath)) {
      console.log(chalk.green(`Detected main CSS file`));
      try {
        const scssPath = path.resolve(integration.entries.integration);
        const result = await sass.compileAsync(scssPath, {
          loadPaths: [
            path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'sass'),
            path.resolve(handoff.workingPath, 'node_modules'),
            path.resolve(handoff.workingPath),
            path.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
          ],
        });
        await fs.writeFile(path.resolve(outputPath, 'main.css'), result.css);
      } catch (e) {
        console.log(chalk.red(`Error compiling main CSS`));
        console.log(e);
      }
    }
  }
};
export default buildComponentCss;
