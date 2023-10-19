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

/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff 
 */
const mergePublicDir = async (handoff: Handoff): Promise<void> => {
  // public working dir
  const publicWorkingDir = path.resolve(handoff.workingPath, 'public');
  // public module dir
  const publicModuleDir = path.resolve(handoff.modulePath, 'src/app/public');

  // if public dir exists in working dir
  if (fs.existsSync(publicWorkingDir)) {

    // move public dir from working dir to module dir
    fs.copySync(publicWorkingDir, publicModuleDir, { overwrite: true });
  }
}

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.outputDirectory, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  mergePublicDir(handoff);
  const appPath = path.resolve(handoff.modulePath, 'src/app');
  // Load and prepare the configuration
  const exportPath = path.resolve(handoff.workingPath, handoff.outputDirectory);
  const config = require(path.resolve(appPath, 'next.config.js'));
  config.distDir = handoff.config.figma_project_id ? `out/${handoff.config.figma_project_id}`: 'out/default';
  config.basePath = handoff.config.next_base_path ? handoff.config.next_base_path : '';
  config.env = config.env ? { ...config.env, ...{ HANDOFF_EXPORT_PATH: exportPath, NEXT_BASE_PATH: config.basePath } } : { HANDOFF_EXPORT_PATH: exportPath, NEXT_BASE_PATH: config.basePath }
  // Build the next app
  await nextBuild([appPath, config]);
  // Clean the working path output directory
  const output = path.resolve(handoff.workingPath, handoff.config.next_out_directory ?? 'out');
  if (fs.existsSync(output)) {
    fs.removeSync(output);
  }
  // Copy the build files int the working path output directory
  fs.copySync(path.resolve(handoff.modulePath, 'src', 'app', config.distDir), path.resolve(handoff.workingPath, handoff.config.next_out_directory ?? 'out'));
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.outputDirectory, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  mergePublicDir(handoff);
  const appPath = path.resolve(handoff.modulePath, 'src/app');
  const config = require(path.resolve(appPath, 'next.config.js'));
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
    dir: path.resolve(handoff.modulePath, 'src/app'),
    hostname,
    port,
    conf: config,
  });
  const handle = app.getRequestHandler();

  // purge out cache
  const moduleOutput = path.resolve(appPath, handoff.config.next_out_directory ?? 'out');
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
  }
  let debounce = false;
  if (fs.existsSync(path.resolve(handoff.workingPath, 'exportables'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if(path.includes('json') && !debounce){
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
          if(path.includes('json') && !debounce){
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
  if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.outputDirectory, 'tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // purge out cache
  const appPath = path.resolve(handoff.modulePath, 'src', 'app');
  const moduleOutput = path.resolve(appPath, handoff.config.next_out_directory ?? 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  return await nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
};

export default buildApp;
