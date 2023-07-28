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
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  await nextBuild([path.resolve(handoff.modulePath, 'src/app')]);
  const output = path.resolve(handoff.workingPath, 'out');
  if (fs.existsSync(output)) {
    fs.removeSync(output);
  }
  fs.moveSync(path.resolve(handoff.modulePath, 'src/app/out'), path.resolve(handoff.workingPath, 'out'));
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  if (!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
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
  if (!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }

  // purge out cache
  const appPath = path.resolve(handoff.modulePath, 'src', 'app');
  const moduleOutput = path.resolve(appPath, 'out');
  if (fs.existsSync(moduleOutput)) {
    fs.removeSync(moduleOutput);
  }

  return await nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
};

export default buildApp;
