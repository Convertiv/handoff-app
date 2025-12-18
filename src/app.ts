import chokidar from 'chokidar';
import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import { WebSocket } from 'ws';
import Handoff from '.';
import { getClientConfig } from './config';
import { buildComponents } from './pipeline';
import processComponents, {
  ComponentSegment,
} from './transformers/preview/component/builder';
import { ComponentListObject } from './transformers/preview/types';
import { Logger } from './utils/logger';

interface HandoffWebSocket extends WebSocket {
  isAlive: boolean;
}

interface WatcherState {
  debounce: boolean;
  runtimeComponentsWatcher: chokidar.FSWatcher | null;
  runtimeConfigurationWatcher: chokidar.FSWatcher | null;
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
  const heartbeat = function (this: HandoffWebSocket) {
    this.isAlive = true;
  };

  // Setup a new connection
  wss.on('connection', (ws) => {
    const extWs = ws as HandoffWebSocket;
    extWs.isAlive = true;
    extWs.send(JSON.stringify({ type: 'WELCOME' }));
    extWs.on('error', (error) => Logger.error('WebSocket error:', error));
    extWs.on('pong', heartbeat);
  });

  // Periodically ping clients to ensure they are still connected
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as HandoffWebSocket;
      if (!extWs.isAlive) {
        Logger.warn('Terminating inactive client');
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

  Logger.success(`WebSocket server listening on ws://localhost:${port}`);

  // Return a function to broadcast a message to all connected clients
  return (message: string) => {
    Logger.success(`Broadcasting message to ${wss.clients.size} client(s)`);
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
  const paths = [
    path.resolve(handoff.workingPath, `public-${handoff.getProjectId()}`),
    path.resolve(handoff.workingPath, `public`),
  ];

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
  return path.resolve(
    handoff.modulePath,
    '.handoff',
    `${handoff.getProjectId()}`
  );
};

/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
const syncPublicFiles = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const workingPublicPath = getWorkingPublicPath(handoff);
  if (workingPublicPath) {
    await fs.copy(workingPublicPath, path.resolve(appPath, 'public'), {
      overwrite: true,
    });
  }
};

/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 * This is typically used before rebuilding the application to ensure a clean state.
 *
 * @param handoff - The Handoff instance containing configuration and working paths
 * @returns Promise that resolves when cleanup is complete
 */
const cleanupAppDirectory = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.remove(appPath);
  }
};

/**
 * Publishes the tokens API files to the public directory.
 *
 * @param handoff - The Handoff instance
 */
const generateTokensApi = async (handoff: Handoff) => {
  const apiPath = path.resolve(path.join(handoff.workingPath, 'public/api'));

  await fs.ensureDir(apiPath);

  const tokens = await handoff.getDocumentationObject();

  // Early return if no tokens
  if (!tokens) {
    // Write empty tokens.json for API consistency
    await fs.writeJson(path.join(apiPath, 'tokens.json'), {}, { spaces: 2 });
    return;
  }

  await fs.writeJson(path.join(apiPath, 'tokens.json'), tokens, { spaces: 2 });

  const tokensDir = path.join(apiPath, 'tokens');
  await fs.ensureDir(tokensDir);

  // Only iterate if tokens has properties
  if (tokens && typeof tokens === 'object') {
    const promises: Promise<void>[] = [];
    for (const type in tokens) {
      if (
        type === 'timestamp' ||
        !tokens[type] ||
        typeof tokens[type] !== 'object'
      )
        continue;
      for (const group in tokens[type]) {
        if (tokens[type][group]) {
          promises.push(
            fs.writeJson(
              path.join(tokensDir, `${group}.json`),
              tokens[type][group],
              { spaces: 2 }
            )
          );
        }
      }
    }
    await Promise.all(promises);
  }
};

/**
 * Prepares the project application by copying source files and configuring Next.js.
 *
 * @param handoff - The Handoff instance
 * @returns The path to the prepared application directory
 */
const initializeProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Publish tokens API
  await generateTokensApi(handoff);

  // Prepare project app dir
  await fs.ensureDir(appPath);
  await fs.copy(srcPath, appPath, { overwrite: true });
  await syncPublicFiles(handoff);

  // Prepare project app configuration
  // Warning: Regex replacement is fragile and depends on exact formatting in next.config.mjs
  const handoffProjectId = handoff.getProjectId();
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(
    handoff.workingPath,
    handoff.exportsDirectory,
    handoff.getProjectId()
  );
  const nextConfigPath = path.resolve(appPath, 'next.config.mjs');
  const handoffUseReferences = handoff.config.useVariables ?? false;
  const handoffWebsocketPort = handoff.config.app.ports?.websocket ?? 3001;
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
    .replace(
      /HANDOFF_PROJECT_ID:\s+\'\'/g,
      `HANDOFF_PROJECT_ID: '${handoffProjectId}'`
    )
    .replace(
      /HANDOFF_APP_BASE_PATH:\s+\'\'/g,
      `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`
    )
    .replace(
      /HANDOFF_WORKING_PATH:\s+\'\'/g,
      `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`
    )
    .replace(
      /HANDOFF_MODULE_PATH:\s+\'\'/g,
      `HANDOFF_MODULE_PATH: '${handoffModulePath}'`
    )
    .replace(
      /HANDOFF_EXPORT_PATH:\s+\'\'/g,
      `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`
    )
    .replace(
      /HANDOFF_WEBSOCKET_PORT:\s+\'\'/g,
      `HANDOFF_WEBSOCKET_PORT: '${handoffWebsocketPort}'`
    )
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(nextConfigPath, nextConfigContent);

  return appPath;
};

/**
 * Persists the client config to a JSON file.
 *
 * @param handoff - The Handoff instance
 */
const persistClientConfig = async (handoff: Handoff) => {
  const appPath = getAppPath(handoff);
  const destination = path.resolve(appPath, 'client.config.json');
  // Ensure directory exists
  await fs.ensureDir(appPath);
  await fs.writeJson(
    destination,
    { config: getClientConfig(handoff) },
    { spaces: 2 }
  );
};

/**
 * Watches the working public directory for changes and updates the app.
 *
 * @param handoff - The Handoff instance
 * @param wss - The WebSocket broadcaster
 * @param state - The shared watcher state
 * @param chokidarConfig - Configuration for chokidar
 */
const watchPublicDirectory = (
  handoff: Handoff,
  wss: (msg: string) => void,
  state: WatcherState,
  chokidarConfig: chokidar.WatchOptions
) => {
  if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
    chokidar
      .watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig)
      .on('all', async (event, path) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!state.debounce) {
              state.debounce = true;
              try {
                Logger.warn(
                  'Public directory changed. Handoff will ingest the new data...'
                );
                await syncPublicFiles(handoff);
                wss(JSON.stringify({ type: 'reload' }));
              } catch (e) {
                Logger.error('Error syncing public directory:', e);
              } finally {
                state.debounce = false;
              }
            }
            break;
        }
      });
  }
};

/**
 * Watches the application source code for changes.
 *
 * @param handoff - The Handoff instance
 */
const watchAppSource = (handoff: Handoff) => {
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
          try {
            await initializeProjectApp(handoff);
          } catch (e) {
            Logger.error('Error initializing project app:', e);
          }
          break;
      }
    });
};

/**
 * Watches the user's pages directory for changes.
 *
 * @param handoff - The Handoff instance
 * @param chokidarConfig - Configuration for chokidar
 */
const watchPages = (
  handoff: Handoff,
  chokidarConfig: chokidar.WatchOptions
) => {
  if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
    chokidar
      .watch(path.resolve(handoff.workingPath, 'pages'), chokidarConfig)
      .on('all', async (event, path) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            try {
              Logger.warn(
                `Doc page ${event}ed. Please reload browser to see changes...`
              );
              Logger.debug(`Path: ${path}`);
            } catch (e) {
              Logger.error('Error watching pages:', e);
            }
            break;
        }
      });
  }
};

/**
 * Watches the SCSS entry point for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 * @param chokidarConfig - Configuration for chokidar
 */
const watchScss = async (
  handoff: Handoff,
  state: WatcherState,
  chokidarConfig: chokidar.WatchOptions
) => {
  if (
    handoff.runtimeConfig?.entries?.scss &&
    fs.existsSync(handoff.runtimeConfig?.entries?.scss)
  ) {
    const stat = await fs.stat(handoff.runtimeConfig.entries.scss);
    chokidar
      .watch(
        stat.isDirectory()
          ? handoff.runtimeConfig.entries.scss
          : path.dirname(handoff.runtimeConfig.entries.scss),
        chokidarConfig
      )
      .on('all', async (event, file) => {
        switch (event) {
          case 'add':
          case 'change':
          case 'unlink':
            if (!state.debounce) {
              state.debounce = true;
              try {
                await handoff.getSharedStyles();
              } catch (e) {
                Logger.error('Error processing shared styles:', e);
              } finally {
                state.debounce = false;
              }
            }
        }
      });
  }
};

/**
 * Maps configuration entry types to component segments.
 */
const mapEntryTypeToSegment = (
  type: keyof ComponentListObject['entries']
): ComponentSegment | undefined => {
  return {
    js: ComponentSegment.JavaScript,
    scss: ComponentSegment.Style,
    template: ComponentSegment.Previews,
    templates: ComponentSegment.Previews,
  }[type];
};

/**
 * Gets the paths of runtime components to watch.
 *
 * @param handoff - The Handoff instance
 * @returns A Map of paths to watch and their entry types
 */
const getRuntimeComponentsPathsToWatch = (handoff: Handoff) => {
  const result: Map<string, keyof ComponentListObject['entries']> = new Map();

  for (const runtimeComponentId of Object.keys(
    handoff.runtimeConfig?.entries.components ?? {}
  )) {
    const runtimeComponent =
      handoff.runtimeConfig.entries.components[runtimeComponentId];
    for (const [
      runtimeComponentEntryType,
      runtimeComponentEntryPath,
    ] of Object.entries(runtimeComponent.entries ?? {})) {
      const normalizedComponentEntryPath =
        runtimeComponentEntryPath as string;
      if (fs.existsSync(normalizedComponentEntryPath)) {
        const entryType =
          runtimeComponentEntryType as keyof ComponentListObject['entries'];
        if (fs.statSync(normalizedComponentEntryPath).isFile()) {
          result.set(path.resolve(normalizedComponentEntryPath), entryType);
        } else {
          result.set(normalizedComponentEntryPath, entryType);
        }
      }
    }
  }

  return result;
};

/**
 * Watches runtime components for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 * @param runtimeComponentPathsToWatch - Map of paths to watch
 */
const watchRuntimeComponents = (
  handoff: Handoff,
  state: WatcherState,
  runtimeComponentPathsToWatch: Map<
    string,
    keyof ComponentListObject['entries']
  >
) => {
  if (state.runtimeComponentsWatcher) {
    state.runtimeComponentsWatcher.close();
  }

  if (runtimeComponentPathsToWatch.size > 0) {
    const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
    state.runtimeComponentsWatcher = chokidar.watch(pathsToWatch, {
      ignoreInitial: true,
    });
    state.runtimeComponentsWatcher.on('all', async (event, file) => {
      if (handoff.getConfigFilePaths().includes(file)) {
        return;
      }

      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!state.debounce) {
            state.debounce = true;
            try {
              const entryType = runtimeComponentPathsToWatch.get(file);
              const segmentToUpdate: ComponentSegment = entryType
                ? mapEntryTypeToSegment(entryType)
                : undefined;

              const componentDir = path.basename(
                path.dirname(path.dirname(file))
              );
              await processComponents(handoff, componentDir, segmentToUpdate);
            } catch (e) {
              Logger.error('Error processing component:', e);
            } finally {
              state.debounce = false;
            }
          }
          break;
      }
    });
  }
};

/**
 * Watches the runtime configuration for changes.
 *
 * @param handoff - The Handoff instance
 * @param state - The shared watcher state
 */
const watchRuntimeConfiguration = (handoff: Handoff, state: WatcherState) => {
  if (state.runtimeConfigurationWatcher) {
    state.runtimeConfigurationWatcher.close();
  }

  if (handoff.getConfigFilePaths().length > 0) {
    state.runtimeConfigurationWatcher = chokidar.watch(
      handoff.getConfigFilePaths(),
      { ignoreInitial: true }
    );
    state.runtimeConfigurationWatcher.on('all', async (event, file) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!state.debounce) {
            state.debounce = true;
            try {
              file = path.dirname(file);
              // Reload the Handoff instance to pick up configuration changes
              handoff.reload();
              // After reloading, persist the updated client configuration
              await persistClientConfig(handoff);
              // Restart the runtime components watcher to track potentially updated/added/removed components
              watchRuntimeComponents(
                handoff,
                state,
                getRuntimeComponentsPathsToWatch(handoff)
              );
              // Process components based on the updated configuration and file path
              await processComponents(handoff, path.basename(file));
            } catch (e) {
              Logger.error('Error reloading runtime configuration:', e);
            } finally {
              state.debounce = false;
            }
          }
          break;
      }
    });
  }
};

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff, skipComponents?: boolean): Promise<void> => {
  skipComponents = skipComponents ?? false;
  // Perform cleanup
  await cleanupAppDirectory(handoff);

  // Build components
  if (!skipComponents) {
    await buildComponents(handoff);
  }

  // Prepare app
  const appPath = await initializeProjectApp(handoff);

  await persistClientConfig(handoff);

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
  await fs.ensureDir(outputRoot);

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.getProjectId());
  if (fs.existsSync(output)) {
    await fs.remove(output);
  }

  // Copy the build files into the project output directory
  await fs.copy(path.resolve(appPath, 'out'), output);
};

/**
 * Watch the next js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 *
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  // Initial processing of the components with caching enabled
  // This will skip rebuilding components whose source files haven't changed
  await processComponents(handoff, undefined, undefined, { useCache: true });

  const appPath = await initializeProjectApp(handoff);

  // Persist client configuration
  await persistClientConfig(handoff);

  // Watch app source
  watchAppSource(handoff);

  // // does a ts config exist?
  // let tsconfigPath = 'tsconfig.json';

  // config.typescript = {
  //   ...config.typescript,
  //   tsconfigPath,
  // };
  const dev = true;
  const hostname = 'localhost';
  const port = handoff.config.app.ports?.app ?? 3000;

  // purge out cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    await fs.remove(moduleOutput);
    // create empty directory
    await fs.ensureDir(moduleOutput);
  }
  const nextProcess = spawn('npx', ['next', 'dev', '--port', String(port)], {
    cwd: appPath,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });
  Logger.success(`Ready on http://${hostname}:${port}`);

  nextProcess.on('error', (error) => {
    Logger.error(`Next.js dev process error: ${error}`);
    process.exit(1);
  });

  nextProcess.on('close', (code) => {
    Logger.success(`Next.js dev process closed with code ${code}`);
    process.exit(code);
  });

  const wss = await createWebSocketServer(
    handoff.config.app.ports?.websocket ?? 3001
  );

  const chokidarConfig = {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  };

  const state: WatcherState = {
    debounce: false,
    runtimeComponentsWatcher: null,
    runtimeConfigurationWatcher: null,
  };

  watchPublicDirectory(handoff, wss, state, chokidarConfig);
  watchRuntimeComponents(
    handoff,
    state,
    getRuntimeComponentsPathsToWatch(handoff)
  );
  watchRuntimeConfiguration(handoff, state);
  await watchScss(handoff, state, chokidarConfig);
  watchPages(handoff, chokidarConfig);
};

/**
 * Watch the next js application using the standard Next.js dev server.
 * This is useful for debugging the Next.js app itself without the Handoff overlay.
 *
 * @param handoff
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  // Prepare app
  const appPath = await initializeProjectApp(handoff);

  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    await fs.remove(moduleOutput);
  }

  // Persist client configuration
  await persistClientConfig(handoff);

  // Run
  const devResult = spawn.sync(
    'npx',
    ['next', 'dev', '--port', String(handoff.config.app.ports?.app ?? 3000)],
    {
      cwd: appPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    }
  );

  if (devResult.status !== 0) {
    let errorMsg = `Next.js dev failed with exit code ${devResult.status}`;
    if (devResult.error) {
      errorMsg += `\nSpawn error: ${devResult.error.message}`;
    }
    throw new Error(errorMsg);
  }
};

export default buildApp;
