import { nextBuild } from 'next/dist/cli/next-build';
import { nextDev } from 'next/dist/cli/next-dev';
import Handoff from '.';
import path from 'path';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import chalk from 'chalk';

const getWorkingPublicPath = (handoff: Handoff): string | null => {
  const paths = [
    path.resolve(handoff.workingPath, `public-${handoff.config.figma_project_id}`),
    path.resolve(handoff.workingPath, `public`),
  ];

  for (const path of paths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return null;
};

const getAppPath = (handoff: Handoff): string => {
  return path.resolve(handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`);
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
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
const mergeMDX = async (handoff: Handoff): Promise<void> => {
  const appPath = getAppPath(handoff);
  const pages = path.resolve(handoff.workingPath, `pages`);
  console.log(`Copying MDX files from ${pages} to ${appPath}`);
  if (fs.existsSync(pages)) {
    // Find all mdx files in path
    const files = fs.readdirSync(pages);
    for (const file of files) {
      if (file.endsWith('.mdx')) {
        console.log(`Copying ${file}`);
        fs.copySync(path.resolve(pages, file), path.resolve(appPath, 'pages', file), { overwrite: true });
      }
    }
  }
};

const prepareProjectApp = async (handoff: Handoff): Promise<string> => {
  const srcPath = path.resolve(handoff.modulePath, 'src', 'app');
  const appPath = getAppPath(handoff);

  // Prepare project app dir
  await fs.promises.mkdir(appPath, { recursive: true });
  await fs.copy(srcPath, appPath, { overwrite: true });
  await mergePublicDir(handoff);
  await mergeMDX(handoff);

  // Prepare project app configuration
  const handoffProjectId = handoff.config.figma_project_id ?? '';
  const handoffAppBasePath = handoff.config.app.base_path ?? '';
  const handoffWorkingPath = path.resolve(handoff.workingPath);
  const handoffModulePath = path.resolve(handoff.modulePath);
  const handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
  const nextConfigPath = path.resolve(appPath, 'next.config.js');
  const nextConfigContent = (await fs.readFile(nextConfigPath, 'utf-8'))
    .replace(/basePath:\s+\'\'/g, `basePath: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, `HANDOFF_PROJECT_ID: '${handoffProjectId}'`)
    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, `HANDOFF_APP_BASE_PATH: '${handoffAppBasePath}'`)
    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, `HANDOFF_WORKING_PATH: '${handoffWorkingPath}'`)
    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, `HANDOFF_MODULE_PATH: '${handoffModulePath}'`)
    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, `HANDOFF_EXPORT_PATH: '${handoffExportPath}'`)
    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
  await fs.writeFile(nextConfigPath, nextConfigContent);

  return appPath;
};

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // Prepare app
  const appPath = await prepareProjectApp(handoff);

  // Build app
  await nextBuild(
    {
      lint: true,
      mangling: true,
      experimentalDebugMemoryUsage: false,
      experimentalAppOnly: false,
      experimentalTurbo: false,
      experimentalBuildMode: 'default',
    },
    appPath
  );

  // Ensure output root directory exists
  const outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
  if (!fs.existsSync(outputRoot)) {
    fs.mkdirSync(outputRoot, { recursive: true });
  }

  // Clean the project output directory (if exists)
  const output = path.resolve(outputRoot, handoff.config.figma_project_id);
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
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  const appPath = await prepareProjectApp(handoff);
  const config = require(path.resolve(appPath, 'next.config.js'));

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

  // does a ts config exist?
  let tsconfigPath = 'tsconfig.json';

  config.typescript = {
    ...config.typescript,
    tsconfigPath,
  };
  const dev = true;
  const hostname = 'localhost';
  const port = 3000;
  // when using middleware `hostname` and `port` must be provided below
  const app = next({
    dev,
    dir: appPath,
    hostname,
    port,
    conf: config,
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

  const chokidarConfig = {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  };
  let debounce = false;
  if (fs.existsSync(path.resolve(handoff.workingPath, 'exportables'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (path.includes('json') && !debounce) {
            console.log(chalk.yellow('Exportables changed. Handoff will fetch new tokens...'));
            debounce = true;
            await handoff.fetch();
            debounce = false;
          }
          break;
      }
    });
  }
  if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          console.log(chalk.yellow('Public directory changed. Handoff will ingest the new data...'));
          mergePublicDir(handoff);
          break;
      }
    });
  }

  if (fs.existsSync(path.resolve(handoff.workingPath, 'integration'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'integration')).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (path.includes('json') && !debounce) {
            console.log(chalk.yellow('Integration changed. Handoff will rerender the integrations...'));
            debounce = true;
            await handoff.integration();
            debounce = false;
          }
          break;
      }
    });
  }
  if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'pages')).on('all', async (event, path) => {
      console.log(chalk.yellow('Doc page changed. Please reload browser to see changes...'));
    });
  }
  if (fs.existsSync(path.resolve(handoff.workingPath, 'handoff.config.json'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'handoff.config.json')).on('all', async (event, path) => {
      console.log(chalk.yellow('handoff.config.json changed. Please restart server to see changes...'));
    });
  }
};

/**
 * Watch the next js application
 * @param handoff
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  // Prepare app
  const appPath = await prepareProjectApp(handoff);
  // Purge app cache
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  // Run
  return await nextDev({ port: 3000 }, 'cli', appPath);
};

export default buildApp;
