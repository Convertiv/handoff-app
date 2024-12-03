import path from 'path';
import fs from 'fs-extra';
import sass from 'sass';
import { bundleJSWebpack } from '../../utils/preview';
import chalk from 'chalk';
import { parse } from 'node-html-parser';
import Handoff from '../../index';
import { TransformComponentTokensResult } from './types';
import Handlebars from 'handlebars';
import semver from 'semver';
import { version } from 'yargs';

export interface SnippetMetadata {
  title: string;
  description: string;
  slots: { [key: string]: SlotMetadata };
}

enum SlotType {
  STRING = 'string',
  IMAGE = 'image',
}

export interface SlotMetadata {
  name: string;
  description: string;
  generic: string;
  type: SlotType;
  key?: string;
  validation?: string;
}

/**
 * Create a snippet transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export async function snippetTransformer(handoff: Handoff) {
  // Allow a user to create custom previews by putting templates in a snippets folder
  // Iterate over the html files in that folder and render them as a preview
  const custom = path.resolve(handoff.workingPath, `integration/snippets`);

  const publicPath = path.resolve(handoff.workingPath, `public/snippets`);
  const publicAPIPath = path.resolve(handoff.workingPath, `public/api/component`);
  // ensure public path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  if (fs.existsSync(custom)) {
    console.log(chalk.green(`Rendering Snippet Previews in ${custom}`));
    const sharedStyles = await processSharedStyles(handoff);
    const files = fs.readdirSync(custom);
    const componentData = {};
    for (const file of files) {
      let versions = {};
      let data = undefined;
      if (file.endsWith('.html')) {
        data = await processSnippet(handoff, file, sharedStyles);
        // Write the API file
        // we're in the root directory so this must be version 0.
        versions['v0.0.0'] = data;
      } else if (fs.lstatSync(path.resolve(custom, file)).isDirectory()) {
        // this is a directory structure.  this should be the component name,
        // and each directory inside should be a version
        const versionDirectories = fs.readdirSync(path.resolve(custom, file));
        // The directory name must be a semver
        for (const versionDirectory of versionDirectories) {
          if (semver.valid(versionDirectory)) {
            const versionFiles = fs.readdirSync(path.resolve(custom, file, versionDirectory));
            for (const versionFile of versionFiles) {
              console.log(`Processing version ${versionDirectory} for ${file}`);
              if (versionFile.endsWith('.html')) {
                data = await processSnippet(handoff, versionFile, sharedStyles, path.join(file, versionDirectory));
                versions[versionDirectory] = data;
              }
            }
          } else {
            console.error(`Invalid version directory ${versionDirectory}`);
          }
        }
      }
      if (data) {
        let name = file.replace('.html', '');
        if (componentData[name]) {
          // merge the versions
          componentData[name] = { ...componentData[name], ...versions };
        } else {
          componentData[name] = versions;
        }
        // find the latest version
        let versionSet = Object.keys(componentData[name])
          .filter((key) => semver.valid(key))
          .sort(semver.rcompare);
        if (versionSet.length > 0) {
          let latest = versionSet[0];
          componentData[name]['latest'] = componentData[name][latest];
          componentData[name]['version'] = latest;
        }
      }
    }

    buildPreviewAPI(handoff, componentData);
  }
  return;
}

/**
 * A utility function to rename a snippet
 * @param handoff
 * @param source
 * @param destination
 */
export async function renameSnippet(handoff: Handoff, source: string, destination: string) {
  source = path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'snippets', source);
  destination = path.resolve(handoff.workingPath, handoff.config.integrationPath ?? 'integration', 'snippets', destination);
  ['html', 'js', 'scss', 'css'].forEach(async (ext) => {
    console.log(`Checking for ${source}.${ext}`);
    let test = source.includes(`.${ext}`) ? source : `${source}.${ext}`;
    if (fs.existsSync(test)) {
      await fs.rename(test, destination.includes(`.${ext}`) ? destination : `${destination}.${ext}`);
    }
  });

  // find any references to the old snippet in the pages and replace them with the new snippet id
  // const pagesPath = path.resolve(this.workingPath, 'integration/pages');
}

/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export async function processSharedStyles(handoff: Handoff): Promise<string | null> {
  const custom = path.resolve(handoff.workingPath, `integration/snippets`);
  const publicPath = path.resolve(handoff.workingPath, `public/snippets`);

  // Is there a scss file with the same name?
  const scssPath = path.resolve(custom, 'shared.scss');
  const cssPath = path.resolve(custom, 'shared.css');

  if (fs.existsSync(scssPath) && !fs.existsSync(cssPath)) {
    console.log(chalk.green(`Compiling shared styles`));
    try {
      const result = await sass.compileAsync(scssPath, {
        loadPaths: [
          path.resolve(handoff.workingPath, 'integration/sass'),
          path.resolve(handoff.workingPath, 'node_modules'),
          path.resolve(handoff.workingPath),
          path.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
        ],
      });

      if (result.css) {
        // write the css to the public folder
        const css = '/* These are the shared styles used in every component. */ \n\n' + result.css;
        const cssPath = path.resolve(publicPath, 'shared.css');
        await fs.writeFile(cssPath, result.css);
        return css;
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling shared styles`));
      console.log(e);
    }
  } else if (fs.existsSync(cssPath)) {
    const css = await fs.readFile(cssPath, 'utf8');
    return css;
  }
}

/**
 * Process process a specific snippet
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export async function processSnippet(handoff: Handoff, file: string, sharedStyles: string | null, sub?: string) {
  let data: TransformComponentTokensResult = {
    id: file.replace('.html', ''),
    title: 'Untitled',
    description: 'No description provided',
    preview: 'No preview available',
    previews: [
      {
        title: 'Default',
        values: {},
        url: file,
      },
    ],
    slots: {},
    code: '',
    js: null,
    css: null,
    sass: null,
    sharedStyles: sharedStyles,
  };
  console.log(chalk.green(`Processing snippet ${file}`));
  if (!sub) sub = '';
  const custom = path.resolve(handoff.workingPath, `integration/snippets`, sub);
  const publicPath = path.resolve(handoff.workingPath, `public/api/component`);
  // Ensure the public API path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  // Is there a JSON file with the same name?
  const jsonFile = file.replace('.html', '.json');
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
          data.description = parsed.description;
          data.slots = parsed.slots;
          data.previews = parsed.previews;
        }
      } catch (e) {
        console.log(chalk.red(`Error parsing JSON for ${file}`));
        console.log(e);
      }
    }
  }

  // Is there a JS file with the same name?
  const jsFile = file.replace('.html', '.js');
  if (fs.existsSync(path.resolve(custom, jsFile))) {
    console.log(chalk.green(`Detected JS file for ${file}`));
    try {
      const jsPath = path.resolve(custom, jsFile);
      const js = await fs.readFile(jsPath, 'utf8');
      const compiled = await bundleJSWebpack(jsPath, handoff, 'development');
      if (js) {
        data.js = js;
        data['jsCompiled'] = compiled;
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling JS for ${file}`));
      console.log(e);
    }
  }
  // Is there a scss file with the same name?
  const scssFile = file.replace('.html', '.scss');
  const scssPath = path.resolve(custom, scssFile);
  const cssFile = file.replace('.html', '.css');
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
      }
    } catch (e) {
      console.log(chalk.red(`Error compiling SCSS for ${file}`));
      console.log(e);
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
  const template = await fs.readFile(path.resolve(custom, file), 'utf8');

  try {
    const previews = {};

    for (const previewKey in data.previews) {
      const url = file.replace('.html', `-${previewKey}.html`);
      data.previews[previewKey].url = url;
      const publicFile = path.resolve(publicPath, url);
      previews[previewKey] = Handlebars.compile(template)({
        config: handoff.config,
        style: data['css'] ? `<style rel="stylesheet" type="text/css">${data['css']}</style>` : '',
        script: data['jsCompiled']
          ? `<script src="data:text/javascript;base64,${Buffer.from(data['jsCompiled']).toString('base64')}"></script>`
          : '',
        sharedStyles: sharedStyles ? `<style rel="stylesheet" type="text/css">${sharedStyles}</style>` : 'shared',
        slot: data.previews[previewKey]?.values || {},
      });
      await fs.writeFile(publicFile, previews[previewKey]);
    }
    data.preview = '';
    const bodyEl = parse(template).querySelector('body');
    const code = bodyEl ? bodyEl.innerHTML.trim() : template;
    data['code'] = code;
    data['sharedStyles'] = sharedStyles;
    // discard shared styles from the css output
  } catch (e) {
    console.log(e);
    // write the preview to the public folder
    throw new Error('stop');
  }
  // Split the CSS into shared styles and component styles
  const splitCSS = data['css']?.split('/* COMPONENT STYLES*/');
  // If there are two parts, the first part is the shared styles
  if (splitCSS && splitCSS.length > 1) {
    data['css'] = splitCSS[1];
    data['sharedStyles'] = splitCSS[0];
  }
  return data;
}

const buildPreviewAPI = async (handoff: Handoff, componentData: any) => {
  const publicPath = path.resolve(handoff.workingPath, `public/api/component`);

  const files = fs.readdirSync(publicPath);
  const output = [];

  for (const component in componentData) {
    // find the latest
    let latest = componentData[component]['latest'];
    if (latest) {
      // read the file
      output.push({
        id: component,
        version: componentData[component]['version'],
        title: latest.title,
        description: latest.description,
        slots: latest.slots,
      });
    } else {
      console.log(`No latest version found for ${component}`);
    }
    await fs.writeFile(path.resolve(publicPath, `${component}.json`), JSON.stringify(componentData[component], null, 2));
  }
  await fs.writeFile(publicPath + 's.json', JSON.stringify(output, null, 2));
};
