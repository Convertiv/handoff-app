import path from 'path';
import fs from 'fs-extra';
import sass from 'sass';
import { bundleJSWebpack } from '../../utils/preview';
import chalk from 'chalk';
import { parse } from 'node-html-parser';
import Handoff from '../../index';
import { TransformComponentTokensResult } from './types';
import Handlebars from 'handlebars';

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
  // ensure public path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  if (fs.existsSync(custom)) {
    console.log(chalk.green(`Rendering Snippet Previews in ${custom}`));
    const sharedStyles = await processSharedStyles(handoff);
    const files = fs.readdirSync(custom);
    for (const file of files) {
      if (file.endsWith('.html')) {
        await processSnippet(handoff, file, sharedStyles);
      }
    }
    buildPreviewAPI(handoff);
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
export async function processSnippet(handoff: Handoff, file: string, sharedStyles: string | null) {
  let data: TransformComponentTokensResult = {
    id: file,
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
  const custom = path.resolve(handoff.workingPath, `integration/snippets`);
  const publicPath = path.resolve(handoff.workingPath, `public/api/preview`);
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
  } catch (e) {
    console.log(e);
    // write the preview to the public folder
    throw new Error('stop');
  }

  await fs.writeFile(path.resolve(publicPath, file.replace('.html', '.json')), JSON.stringify(data, null, 2));
}

const buildPreviewAPI = async (handoff: Handoff) => {
  const publicPath = path.resolve(handoff.workingPath, `public/api/preview`);

  const files = fs.readdirSync(publicPath);
  const output = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      // read the file
      const data = await fs.readFile(path.resolve(publicPath, file), 'utf8');
      const parsed = JSON.parse(data);
      output.push({
        id: parsed.id,
        title: parsed.title,
        description: parsed.description,
        slots: parsed.slots,
      });
    }
  }
  await fs.writeFile(publicPath + 's.json', JSON.stringify(output, null, 2));
};
