import build from 'next/dist/build/index';
import { nextBuild } from 'next/dist/cli/next-build';
import { nextDev } from 'next/dist/cli/next-dev';
import exportApp from 'next/dist/export/index';
import { trace } from 'next/dist/trace';
import Handoff from '.';
import path from 'path';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs-extra';
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  if(!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  await nextBuild([path.resolve(handoff.modulePath, 'src/app')]);
  fs.removeSync(path.resolve(handoff.workingPath, 'out'));
  fs.moveSync(path.resolve(handoff.modulePath, 'src/app/out'), path.resolve(handoff.workingPath, 'out'));
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  if(!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
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
  const dev = process.env.NODE_ENV !== 'production';
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
};

/**
 * Watch the next js application
 * @param handoff
 */
export const devApp = async (handoff: Handoff): Promise<void> => {
  if(!fs.existsSync(path.resolve(handoff.workingPath, 'exported/tokens.json'))) {
    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
  }
  return await nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
};

export default buildApp;
