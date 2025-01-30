import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import sass from 'sass';
import Handoff from '../../../index';
import { bundleJSWebpack } from '../../../utils/preview';
import { ComponentType, TransformComponentTokensResult } from '../types';
import buildPreviews from './html';

/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export async function processComponent(handoff: Handoff, file: string, sharedStyles: string | null, version?: string) {
  let id = path.basename(file).replace('.hbs', '');
  let data: TransformComponentTokensResult = {
    id,
    title: 'Untitled',
    description: 'No description provided',
    preview: 'No preview available',
    type: ComponentType.Element,
    group: 'default',
    should_do: [],
    should_not_do: [],
    tags: [],
    previews: [
      {
        title: 'Default',
        values: {},
        url: file,
      },
    ],
    properties: {},
    code: '',
    html: '',
    js: null,
    css: null,
    sass: null,
    sharedStyles: sharedStyles,
  };
  console.log(chalk.green(`Processing component ${file} ${version}`));
  const componentPath = path.resolve(handoff.workingPath, `integration/components`, id);
  if (!version) {
    // find latest version
    const versions = fs.readdirSync(componentPath).filter((f) => fs.statSync(path.join(componentPath, f)).isDirectory());
    const latest = versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
    if (!latest) {
      throw new Error(`No version found for ${id}0`);
    }
    version = latest;
  }
  const custom = version ? path.resolve(componentPath, version) : componentPath;
  if (!fs.existsSync(custom)) {
    throw new Error(`No version found for ${id}1`);
  }

  const publicPath = path.resolve(handoff.workingPath, `public/api/component`);
  // Ensure the public API path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  // Is there a JSON file with the same name?
  const jsonFile = id + '.json';
  const jsonPath = path.resolve(custom, jsonFile);
  let parsed: any = {};
  if (fs.existsSync(jsonPath)) {
    const json = await fs.readFile(jsonPath, 'utf8');
    if (json) {
      try {
        parsed = JSON.parse(json);
        // The JSON file defines each of the fields
        if (parsed) {
          data.title = parsed.title;
          data.should_do = parsed.should_do || [];
          data.should_not_do = parsed.should_not_do || [];
          data.type = (parsed.type as ComponentType) || ComponentType.Element;
          data.group = parsed.group || 'default';
          data.tags = parsed.tags || [];
          data.description = parsed.description;
          data.properties = parsed.properties;
          data.previews = parsed.previews;
        }
      } catch (e) {
        console.log(chalk.red(`Error parsing JSON for ${file}`));
        console.log(e);
      }
    }
  }

  // Is there a JS file with the same name?
  const jsFile = id + '.js';
  if (fs.existsSync(path.resolve(custom, jsFile))) {
    console.log(chalk.green(`Detected JS file for ${file}`));
    try {
      const jsPath = path.resolve(custom, jsFile);
      const js = await fs.readFile(jsPath, 'utf8');
      const compiled = await bundleJSWebpack(jsPath, handoff, 'development');
      if (js) {
        data.js = js;
        data['jsCompiled'] = compiled;
        await fs.writeFile(path.resolve(publicPath, jsFile), compiled);
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling JS for ${file}`));
      console.log(e);
    }
  }
  // Is there a scss file with the same name?
  const scssFile = id + '.scss';
  const scssPath = path.resolve(custom, scssFile);
  const cssFile = id + '.css';
  const cssPath = path.resolve(custom, cssFile);
  if (fs.existsSync(scssPath) && !fs.existsSync(cssPath)) {
    console.log(chalk.green(`Detected SCSS file for ${file}`));
    try {
      const result = await sass.compileAsync(scssPath, {
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
          await fs.writeFile(path.resolve(publicPath, `shared.css`), data['sharedStyles']);
        } else {
          if (!sharedStyles) sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
          await fs.writeFile(path.resolve(publicPath, `shared.css`), sharedStyles);
        }
        await fs.writeFile(path.resolve(publicPath, cssFile), data['css']);
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling SCSS for ${file}`));
      throw e;
    }
    const scss = await fs.readFile(scssPath, 'utf8');
    if (scss) {
      data['sass'] = scss;
    }
  }

  // Is there a css file with the same name?
  if (fs.existsSync(cssPath)) {
    const css = await fs.readFile(path.resolve(custom, cssFile), 'utf8');
    if (css) {
      data['css'] = css;
    }
  }
  data = await buildPreviews(data, id, custom, publicPath, handoff);
  data.sharedStyles = sharedStyles;
  return data;
}

export default processComponent;
