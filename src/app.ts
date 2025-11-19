import chalk from 'chalk';
import chokidar from 'chokidar';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import { createServer } from 'http';
import next from 'next';
import path from 'path';
import { parse } from 'url';
import { WebSocket } from 'ws';
import Handoff from '.';
import { getClientConfig } from './config';
import { buildComponents } from './pipeline';
import processComponents, { ComponentSegment } from './transformers/preview/component/builder';
import { ComponentListObject } from './transformers/preview/types';

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
const createWebSocketServer = async (port: number = 3001) => {
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

/**
 * Gets the working public directory path for a given handoff instance
 * Checks for both project-specific and default public directories
 *
 * @param handoff - The handoff instance containing working path and figma project configuration
 * @returns The resolved path to the public directory if it exists, null otherwise
 */
const getWorkingPublicPath = (handoff: Handoff): string | null => {
  const paths = [path.resolve(handoff.workingPath, `public-${handoff.getProjectId()}`), path.resolve(handoff.workingPath, `public`)];

  for (const path of paths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return null;
};

/**
 * Gets the application path for a given handoff instance
 * @param handoff - The handoff instance containing module path and figma project configuration
 * @returns The resolved path to the application directory
 */
const getAppPath = (handoff: Handoff): string => {
  return path.resolve(handoff.modulePath, '.handoff', `${handoff.getProjectId()}`);
};

/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
const mergePublicDir = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const workingPublicPath = getWorkingPublicPath(handoff);
  if (workingPublicPath) {
    fs.copySync(workingPublicPath, path.resolve(appPath, 'public'), { overwrite: true });
  }
};

/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 * This is typically used before rebuilding the application to ensure a clean state.
 *
 * @param handoff - The Handoff instance containing configuration and working paths
 * @returns Promise that resolves when cleanup is complete
 */
const performCleanup = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.rm(appPath, { recursive: true });
  }
};

const publishTokensApi = async (handoff: Handoff) => {
  const apiPath = path.resolve(path.join(handoff.workingPath, 'public/api'));

  if (!fs.existsSync(apiPath)) {
    fs.mkdirSync(apiPath, { recursive: true });
  }

  const tokens = await handoff.getDocumentationObject();

  // Early return if no tokens
  if (!tokens) {
    // Write empty tokens.json for API consistency
    fs.writeFileSync(path.join(apiPath, 'tokens.json'), JSON.stringify({}, null, 2));
    return;
  }

  fs.writeFileSync(path.join(apiPath, 'tokens.json'), JSON.stringify(tokens, null, 2));

  if (!fs.existsSync(path.join(apiPath, 'tokens'))) {
    fs.mkdirSync(path.join(apiPath, 'tokens'), { recursive: true });
  }

  // Only iterate if tokens has properties
  if (tokens && typeof tokens === 'object') {
    for (const type in tokens) {
      if (type === 'timestamp' || !tokens[type] || typeof tokens[type] !== 'object') continue;
      for (const group in tokens[type]) {
        if (tokens[type][group]) {
          fs.writeFileSync(path.join(apiPath, 'tokens', `${group}.json`), JSON.stringify(tokens[type][group], null, 2));
        }
      }
    }
  }
};

const prepareProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Publish tokens API
  publishTokensApi(handoff);

  // Prepare project app dir
  await fs.promises.mkdir(appPath, { recursive: true });
  await fs.copy(srcPath, appPath, { overwrite: true });
  await mergePublicDir(handoff);

  // Prepare project app configuration
  const handoffProjectId = handoff.getProjectId();
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId());
  const nextConfigPath = path.resolve(appPath, 'next.config.mjs');
  const handoffUseReferences = handoff.config.useVariables ?? false;
  const handoffWebsocketPort = handoff.config.app.ports?.websocket ?? 3001;
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
    .replace(/HANDOFF_WEBSOCKET_PORT:\s+\'\'/g, `HANDOFF_WEBSOCKET_PORT: '${handoffWebsocketPort}'`)
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(nextConfigPath, nextConfigContent);

  return appPath;
};

const persistRuntimeCache = (handoff: Handoff) => {
  const appPath = getAppPath(handoff);
  const destination = path.resolve(appPath, 'runtime.cache.json');
  // Ensure directory exists
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }
  fs.writeFileSync(destination, JSON.stringify({ config: getClientConfig(handoff), ...handoff.runtimeConfig }, null, 2), 'utf-8');
};

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  // Perform cleanup
  await performCleanup(handoff);

  // Build components
  await buildComponents(handoff);

  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  persistRuntimeCache(handoff);

  // Build app
  const buildResult = spawn.sync('npx', ['next', 'build'], {
    cwd: appPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  if (buildResult.status !== 0) {
    let errorMsg = `Next.js build failed with exit code ${buildResult.status}`;
    if (buildResult.error) {
      errorMsg += `\nSpawn error: ${buildResult.error.message}`;
    }
    throw new Error(errorMsg);
  }

  // Ensure output root directory exists
  const outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
  }

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.getProjectId());
  if (fs.existsSync(output)) {
    fs.removeSync(output);
  }

  // Copy the build files into the project output directory
  fs.copySync(path.resolve(appPath, 'out'), output);
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  // Initial processing of the components
  await processComponents(handoff);

  const appPath = await prepareProjectApp(handoff);
  // Include any changes made within the app source during watch
  chokidar
    .watch(path.resolve(handoff.modulePath, 'src', 'app'), {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })
    .on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          await prepareProjectApp(handoff);
          break;
      }
    });

  // // does a ts config exist?
  // let tsconfigPath = 'tsconfig.json';

  // config.typescript = {
  //   ...config.typescript,
  //   tsconfigPath,
  // };
  const dev = true;
  const hostname = 'localhost';
  const port = handoff.config.app.ports?.app ?? 3000;
  // when using middleware `hostname` and `port` must be provided below
  const app = next({
    dev,
    dir: appPath,
    hostname,
    port,
    // conf: config,
  });

  const handle = app.getRequestHandler();

  // purge out cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }
  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        // Be sure to pass `true` as the second argument to `url.parse`.
        // This tells it to parse the query portion of the URL.
        if (!req.url) throw new Error('No url');
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err: string) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  });

  const wss = await createWebSocketServer(handoff.config.app.ports?.websocket ?? 3001);

  const chokidarConfig = {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  };
  let debounce = false;
  if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!debounce) {
            debounce = true;
            console.log(chalk.yellow('Public directory changed. Handoff will ingest the new data...'));
            await mergePublicDir(handoff);
            wss(JSON.stringify({ type: 'reload' }));
            debounce = false;
          }
          break;
      }
    });
  }

  let runtimeComponentsWatcher: chokidar.FSWatcher | null = null;
  let runtimeConfigurationWatcher: chokidar.FSWatcher | null = null;

  const entryTypeToSegment = (type: keyof ComponentListObject['entries']): ComponentSegment | undefined => {
    return {
      js: ComponentSegment.JavaScript,
      scss: ComponentSegment.Style,
      template: ComponentSegment.Previews,
      templates: ComponentSegment.Previews,
    }[type];
  };

  const watchRuntimeComponents = (runtimeComponentPathsToWatch: Map<string, keyof ComponentListObject['entries']>) => {
    persistRuntimeCache(handoff);

    if (runtimeComponentsWatcher) {
      runtimeComponentsWatcher.close();
    }

    if (runtimeComponentPathsToWatch.size > 0) {
      const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
      runtimeComponentsWatcher = chokidar.watch(pathsToWatch, { ignoreInitial: true });
      runtimeComponentsWatcher.on('all', async (event, file) => {
        if (handoff.getConfigFilePaths().includes(file)) {
          return;
        }

        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              const entryType = runtimeComponentPathsToWatch.get(file);
              const segmentToUpdate: ComponentSegment = entryType ? entryTypeToSegment(entryType) : undefined;

              const componentDir = path.basename(path.dirname(path.dirname(file)));
              await processComponents(handoff, componentDir, segmentToUpdate);
              debounce = false;
            }
            break;
        }
      });
    }
  };

  const watchRuntimeConfiguration = () => {
    if (runtimeConfigurationWatcher) {
      runtimeConfigurationWatcher.close();
    }

    if (handoff.getConfigFilePaths().length > 0) {
      runtimeConfigurationWatcher = chokidar.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
      runtimeConfigurationWatcher.on('all', async (event, file) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              file = path.dirname(path.dirname(file));
              handoff.reload();
              watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
              await processComponents(handoff, path.basename(file));
              debounce = false;
            }
            break;
        }
      });
    }
  };

  const getRuntimeComponentsPathsToWatch = () => {
    const result: Map<string, keyof ComponentListObject['entries']> = new Map();

    for (const runtimeComponentId of Object.keys(handoff.runtimeConfig?.entries.components ?? {})) {
      for (const runtimeComponentVersion of Object.keys(handoff.runtimeConfig.entries.components[runtimeComponentId])) {
        const runtimeComponent = handoff.runtimeConfig.entries.components[runtimeComponentId][runtimeComponentVersion];
        for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries(runtimeComponent.entries ?? {})) {
          const normalizedComponentEntryPath = runtimeComponentEntryPath as string;
          if (fs.existsSync(normalizedComponentEntryPath)) {
            const entryType = runtimeComponentEntryType as keyof ComponentListObject['entries'];
            if (fs.statSync(normalizedComponentEntryPath).isFile()) {
              result.set(path.resolve(normalizedComponentEntryPath), entryType);
            } else {
              result.set(normalizedComponentEntryPath, entryType);
            }
          }
        }
      }
    }

    return result;
  };

  watchRuntimeComponents(getRuntimeComponentsPathsToWatch());
  watchRuntimeConfiguration();

  if (handoff.runtimeConfig?.entries?.scss && fs.existsSync(handoff.runtimeConfig?.entries?.scss)) {
    const stat = await fs.stat(handoff.runtimeConfig.entries.scss);
    chokidar
      .watch(
        stat.isDirectory() ? handoff.runtimeConfig.entries.scss : path.dirname(handoff.runtimeConfig.entries.scss),
        chokidarConfig
      )
      .on('all', async (event, file) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!debounce) {
              debounce = true;
              await handoff.getSharedStyles();
              debounce = false;
            }
        }
      });
  }

  if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'pages'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          console.log(chalk.yellow(`Doc page ${event}ed. Please reload browser to see changes...`), path);
          break;
      }
    });
  }
};

/**
 * Watch the next js application
 * @param handoff
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  persistRuntimeCache(handoff);

  // Run
  const devResult = spawn.sync('npx', ['next', 'dev', '--port', String(handoff.config.app.ports?.app ?? 3000)], {
    cwd: appPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  if (devResult.status !== 0) {
    let errorMsg = `Next.js dev failed with exit code ${devResult.status}`;
    if (devResult.error) {
      errorMsg += `\nSpawn error: ${devResult.error.message}`;
    }
    throw new Error(errorMsg);
  }
};

export default buildApp;
