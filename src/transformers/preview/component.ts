import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import sass from 'sass';
import { FileComponentsObject } from '../../exporters/components/types';
import Handoff from '../../index';
import writeComponentSummaryAPI, { getAPIPath } from './component/api';
import processComponent from './component/builder';
import { buildMainCss } from './component/css';
import { buildMainJS } from './component/javascript';

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
  type?: string;
  group?: string;
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

export const getComponentPath = (handoff: Handoff) => path.resolve(handoff.workingPath, `integration/components`);
export const getComponentOutputPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'component');
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export async function componentTransformer(handoff: Handoff, components?: FileComponentsObject) {
  // Allow a user to create custom previews by putting templates in a components folder
  // Iterate over the html files in that folder and render them as a preview
  const componentPath = getComponentPath(handoff);
  if (fs.existsSync(componentPath)) {
    console.log(chalk.green(`Rendering Component Previews in ${componentPath}`));
    const sharedStyles = await processSharedStyles(handoff);
    const files = fs.readdirSync(componentPath);
    const componentData = [];
    for (const file of files) {
      componentData.push(await processComponent(handoff, path.basename(file), sharedStyles, components));
    }
    await writeComponentSummaryAPI(handoff, componentData);
    await buildMainJS(handoff);
    await buildMainCss(handoff);
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
