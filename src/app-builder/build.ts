import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildComponents } from '../pipeline/components';
import processComponents from '../transformers/preview/component/builder';
import { Logger } from '../utils/logger';
import { generateTokensApi, persistClientConfig } from './client-config';
import { getAppPath, syncPublicFiles } from './paths';
import { WatcherState, getRuntimeComponentsPathsToWatch, watchAppSource, watchPages, watchPublicDirectory, watchRuntimeComponents, watchRuntimeConfiguration } from './watchers';
import { createWebSocketServer } from './websocket';

/**
 * Performs cleanup of the application directory by removing the existing app directory if it exists.
 */
const cleanupAppDirectory = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);

  // Clean project app dir
  if (fs.existsSync(appPath)) {
    await fs.remove(appPath);
  }
};

/**
 * Prepares the project application by copying source files and configuring Next.js.
 *
 * @returns The path to the prepared application directory
 */
const initializeProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Publish tokens API
  await generateTokensApi(handoff);

  // Prepare project app dir
  await fs.ensureDir(appPath);
  await fs.copy(srcPath, appPath, { overwrite: true, filter: (file) => !file.includes('next.config.mjs') });
  await syncPublicFiles(handoff);

  // Copy custom theme CSS if it exists in the user's project
  const customThemePath = path.resolve(handoff.workingPath, 'theme.css');
  if (fs.existsSync(customThemePath)) {
    const destPath = path.resolve(appPath, 'css', 'theme.css');
    await fs.copy(customThemePath, destPath, { overwrite: true });
    Logger.success(`Custom theme.css loaded`);
  }

  // Prepare project app configuration
  // Warning: Regex replacement is fragile and depends on exact formatting in next.config.mjs
  const handoffProjectId = handoff.getProjectId();
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.getProjectId());
  const nextConfigPath = path.resolve(srcPath, 'next.config.mjs');
  const targetPath = path.resolve(appPath, 'next.config.mjs');
  const handoffWebsocketPort = handoff.config.app.ports?.websocket ?? 3001;
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+''/g, `basePath: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_PROJECT_ID:\s+''/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
    .replace(/HANDOFF_APP_BASE_PATH:\s+''/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_WORKING_PATH:\s+''/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
    .replace(/HANDOFF_MODULE_PATH:\s+''/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
    .replace(/HANDOFF_EXPORT_PATH:\s+''/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
    .replace(/HANDOFF_WEBSOCKET_PORT:\s+''/g, `HANDOFF_WEBSOCKET_PORT: '${handoffWebsocketPort}'`)
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(targetPath, nextConfigContent);
  return appPath;
};

/**
 * Build the Next.js documentation application.
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
 * Watch the Next.js application.
 * Starts a custom dev server with Handoff-specific watchers and hot-reloading.
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  // Initial processing of the components with caching enabled
  // This will skip rebuilding components whose source files haven't changed
  await processComponents(handoff, undefined, undefined, { useCache: true });

  const appPath = await initializeProjectApp(handoff);

  // Persist client configuration
  await persistClientConfig(handoff);

  // Watch app source
  watchAppSource(handoff, initializeProjectApp);

  const hostname = 'localhost';
  const port = handoff.config.app.ports?.app ?? 3000;

  // purge out cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    await fs.remove(moduleOutput);
    // create empty directory
    await fs.ensureDir(moduleOutput);
  }
  const nextProcess = spawn('npx', ['next', 'dev', '--turbopack', '--port', String(port)], {
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

  const wss = await createWebSocketServer(handoff.config.app.ports?.websocket ?? 3001);

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
  watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
  watchRuntimeConfiguration(handoff, state);
  watchPages(handoff, chokidarConfig);
};

/**
 * Watch the Next.js application using the standard Next.js dev server.
 * This is useful for debugging the Next.js app itself without the Handoff overlay.
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
  const devResult = spawn.sync('npx', ['next', 'dev', '--turbopack', '--port', String(handoff.config.app.ports?.app ?? 3000)], {
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
