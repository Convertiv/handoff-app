import path from 'path';
import fs from 'fs-extra';
import sass from 'sass';
import { bundleJSWebpack } from '../../utils/preview';
import chalk from 'chalk';
import { parse } from 'node-html-parser';
import Handoff from '../../index';
import { ComponentListObject, ComponentType, TransformComponentTokensResult } from './types';
import Handlebars from 'handlebars';
import semver from 'semver';
import WebSocket from 'ws';

const webSocketClientJS = `
<script>
const ws = new WebSocket('ws://localhost:3001');
  ws.onopen = function (event) {
    console.log('WebSocket connection opened');
    ws.send('Hello from client!');
  };

  ws.onmessage = function (event) {
    console.log('Message from server ', event.data);
    if(event.data === 'reload'){
      window.location.reload();
    }
  };
</script>
`;
export interface ComponentMetadata {
  title: string;
  description: string;
  properties: { [key: string]: SlotMetadata };
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
  rules?: string;
}

interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}

/**
 * In dev mode we want to watch the components folder for changes
 * @param handoff
 * @returns
 * @returns
 */
export const createFrameSocket = async (handoff: Handoff) => {
  const wss = new WebSocket.Server({ port: 3001 });
  function heartbeat() {
    this.isAlive = true;
  }
  wss.on('connection', function connection(ws) {
    const extWs = ws as ExtWebSocket;
    extWs.send('Welcome to the WebSocket server!');
    extWs.isAlive = true;
    extWs.on('error', console.error);
    extWs.on('pong', heartbeat);
  });

  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      const extWs = ws as ExtWebSocket;
      if (extWs.isAlive === false) return ws.terminate();

      extWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', function close() {
    clearInterval(interval);
  });

  console.log('WebSocket server started on ws://localhost:3001');
  return function (message: string) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
};

//

/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export async function componentTransformer(handoff: Handoff) {
  // Allow a user to create custom previews by putting templates in a components folder
  // Iterate over the html files in that folder and render them as a preview
  const custom = path.resolve(handoff.workingPath, `integration/components`);

  const publicPath = path.resolve(handoff.workingPath, `public/components`);
  const publicAPIPath = path.resolve(handoff.workingPath, `public/api/component`);
  // ensure public path exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  if (fs.existsSync(custom)) {
    console.log(chalk.green(`Rendering Component Previews in ${custom}`));
    const sharedStyles = await processSharedStyles(handoff);
    const files = fs.readdirSync(custom);
    const componentData = {};
    for (const file of files) {
      let versions = {};
      let data = undefined;
      if (file.endsWith('.hbs')) {
        data = await processComponent(handoff, file, sharedStyles);
        // Write the API file
        // we're in the root directory so this must be version 0.
        versions['0.0.0'] = data;
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
              if (versionFile.endsWith('.hbs')) {
                data = await processComponent(handoff, versionFile, sharedStyles, path.join(file, versionDirectory));
                versions[versionDirectory] = data;
              }
            }
          } else {
            console.error(`Invalid version directory ${versionDirectory}`);
          }
        }
      }
      if (data) {
        let name = file.replace('.hbs', '');
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

/**
 * Process the shared styles with sass compileAsync
 * @param handoff
 * @returns
 */
export async function processSharedStyles(handoff: Handoff): Promise<string | null> {
  const custom = path.resolve(handoff.workingPath, `integration/components`);
  const publicPath = path.resolve(handoff.workingPath, `public/api/component`);

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
        console.log(chalk.green(`Writing shared styles to ${cssPath}`));
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
    js: null,
    css: null,
    sass: null,
    sharedStyles: sharedStyles,
  };
  console.log(chalk.green(`Processing component ${file}`));
  const componentPath = path.resolve(handoff.workingPath, `integration/components`, id);
  if (!version) {
    // find latest version
    const versions = fs.readdirSync(componentPath).filter((f) => fs.statSync(path.join(componentPath, f)).isDirectory());
    const latest = versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
    if (!latest) {
      throw new Error(`No version found for ${id}`);
    }
    version = latest;
  }
  const custom = version ? path.resolve(componentPath, version) : componentPath;
  if (!fs.existsSync(custom)) {
    throw new Error(`No version found for ${id}`);
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

  const template = await fs.readFile(path.resolve(custom, `${id}.hbs`), 'utf8');

  try {
    const previews = {};

    for (const previewKey in data.previews) {
      const url = id + `-${previewKey}.html`;
      data.previews[previewKey].url = url;
      const publicFile = path.resolve(publicPath, url);
      const jsCompiled = data['jsCompiled'] ? `<script src="/api/component/${jsFile}"></script>` : '';
      let style = data['css'] ? `<link rel="stylesheet" href="/api/component/${cssFile}">` : '';
      if (data['sharedStyles']) {
        style = `<link rel="stylesheet" href="/api/component/shared.css">` + style;
      }
      previews[previewKey] = Handlebars.compile(template)({
        config: handoff.config,
        style: style,
        script: jsCompiled + '\n' + webSocketClientJS,
        sharedStyles: data['css'] ? `<link rel="stylesheet" href="/api/component/shared.css">` : '',
        properties: data.previews[previewKey]?.values || {},
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

  return data;
}

/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
const buildPreviewAPI = async (handoff: Handoff, componentData: any) => {
  const publicPath = path.resolve(handoff.workingPath, `public/api`);

  const files = fs.readdirSync(publicPath);
  const output: ComponentListObject[] = [];
  const content = {};

  for (const component in componentData) {
    // find the latest
    let latest = componentData[component]['latest'];
    if (latest) {
      // read the file
      output.push({
        id: component,
        version: componentData[component]['version'],
        title: latest.title,
        type: latest.type,
        group: latest.group,
        tags: latest.tags,
        description: latest.description,
        properties: latest.properties,
      });
      // iterate over the properties and add them to the content
      for (const property in latest.properties) {
        if (!content[property]) {
          content[property] = {
            id: property,
            name: latest.properties[property].name,
            description: latest.properties[property].description,
            type: latest.properties[property].type,
            components: [],
          };
        } else {
          // merge the rules
          // content[property].rules = [...new Set([...content[property].rules, ...latest.properties[property].rules])];
        }
        let previews = {};
        for (const preview in latest.previews) {
          previews[preview] = latest.previews[preview].values[property] ?? '';
        }
        content[property].components.push({ component, previews });
      }
    } else {
      console.log(`No latest version found for ${component}`);
    }
    await fs.writeFile(path.resolve(publicPath, 'component', `${component}.json`), JSON.stringify(componentData[component], null, 2));
  }

  // write the content file
  await fs.writeFile(path.resolve(publicPath, 'content.json'), JSON.stringify(content, null, 2));
  await fs.writeFile(path.resolve(publicPath, 'components.json'), JSON.stringify(output, null, 2));
};
