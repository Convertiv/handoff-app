import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import sass from 'sass';
import semver from 'semver';
import Handoff from '../../index';
import processComponent from './component/builder';
import { ComponentListObject } from './types';

// const webSocketClientJS = `
// <script>
// const ws = new WebSocket('ws://localhost:3001');
//   ws.onopen = function (event) {
//     console.log('WebSocket connection opened');
//     ws.send('Hello from client!');
//   };

//   ws.onmessage = function (event) {
//     console.log('Message from server ', event.data);
//     if(event.data === 'reload'){
//       window.location.reload();
//     }
//   };
// </script>
// `;
export interface ComponentMetadata {
  title: string;
  description: string;
  properties: { [key: string]: SlotMetadata };
}

export enum SlotType {
  TEXT = 'text',
  IMAGE = 'image',
  BUTTON = 'button',
  ARRAY = 'array',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
}

export interface SlotMetadata {
  id?: string;
  name: string;
  description: string;
  generic: string;
  default?: string;
  type: SlotType;
  // used if type is array
  items?: {
    type: SlotType;
    properties?: { [key: string]: SlotMetadata };
  };
  // Used if type is object
  properties?: { [key: string]: SlotMetadata };
  key?: string;
  rules?: RuleObject;
}

export type RuleObject = {
  required?: boolean;
  content?: {
    min: number;
    max: number;
  };
  dimension?: {
    width: number;
    height: number;
    min: {
      width: number;
      height: number;
    };
    max: {
      width: number;
      height: number;
    };
    recommend: {
      width: number;
      height: number;
    };
  };
  filesize?: number;
  filetype?: string;
  pattern?: string;
};

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
  // const wss = new WebSocket.Server({ port: 3001 });
  // function heartbeat() {
  //   this.isAlive = true;
  // }
  // wss.on('connection', function connection(ws) {
  //   const extWs = ws as ExtWebSocket;
  //   extWs.send('Welcome to the WebSocket server!');
  //   extWs.isAlive = true;
  //   extWs.on('error', console.error);
  //   extWs.on('pong', heartbeat);
  // });
  // const interval = setInterval(function ping() {
  //   wss.clients.forEach(function each(ws) {
  //     const extWs = ws as ExtWebSocket;
  //     if (extWs.isAlive === false) return ws.terminate();
  //     extWs.isAlive = false;
  //     ws.ping();
  //   });
  // }, 30000);
  // wss.on('close', function close() {
  //   clearInterval(interval);
  // });
  // console.log('WebSocket server started on ws://localhost:3001');
  // return function (message: string) {
  //   wss.clients.forEach(function each(client) {
  //     if (client.readyState === WebSocket.OPEN) {
  //       client.send(message);
  //     }
  //   });
  // };
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
              if (versionFile.endsWith('.hbs')) {
                data = await processComponent(handoff, versionFile, sharedStyles, versionDirectory);
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
