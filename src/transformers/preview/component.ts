import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import sass from 'sass';
import WebSocket from 'ws';
import Handoff from '../../index';
import writeComponentSummaryAPI, { getAPIPath } from './component/api';
import processComponents from './component/builder';
import { buildMainCss } from './component/css';
import { buildMainJS } from './component/javascript';

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
 * Creates a WebSocket server that broadcasts messages to connected clients.
 * Designed for development mode to help with hot-reloading.
 *
 * @param port - Optional port number for the WebSocket server; defaults to 3001.
 * @returns A function that accepts a message string and broadcasts it to all connected clients.
 */
export const createWebSocketServer = async (port: number = 3001) => {
  const wss = new WebSocket.Server({ port });

  // Heartbeat function to mark a connection as alive.
  const heartbeat = function (this: ExtWebSocket) {
    this.isAlive = true;
  };

  // Setup a new connection
  wss.on('connection', (ws) => {
    const extWs = ws as ExtWebSocket;
    extWs.isAlive = true;
    extWs.send(JSON.stringify({ type: 'WELCOME' }));
    extWs.on('error', (error) => console.error('WebSocket error:', error));
    extWs.on('pong', heartbeat);
  });

  // Periodically ping clients to ensure they are still connected
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as ExtWebSocket;
      if (!extWs.isAlive) {
        console.log(chalk.yellow('Terminating inactive client'));
        return client.terminate();
      }
      extWs.isAlive = false;
      client.ping();
    });
  }, 30000);

  // Clean up the interval when the server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log(chalk.green(`WebSocket server started on ws://localhost:${port}`));

  // Return a function to broadcast a message to all connected clients
  return (message: string) => {
    console.log(chalk.green(`Broadcasting message to ${wss.clients.size} client(s)`));
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
};

export const getComponentPath = (handoff: Handoff) => path.resolve(handoff.workingPath, `integration/components`);
export const getComponentOutputPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'component');
/**
 * Create a component transformer
 * @param handoff
 * @param documentationObject
 * @returns
 */
export async function componentTransformer(handoff: Handoff) {
  const componentData = await processComponents(handoff);
  await writeComponentSummaryAPI(handoff, componentData);
  await buildMainJS(handoff);
  await buildMainCss(handoff);
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
