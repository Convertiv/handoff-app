import build from 'next/dist/build/index';
import exportApp from 'next/dist/export/index';
import { trace } from 'next/dist/trace';
import { nextDev } from 'next/dist/cli/next-dev';
import Handoff from '.';
import path from 'path';

import { watchFile } from 'fs';
import { startServer } from 'next/dist/server/lib/start-server';
import { startedDevelopmentServer } from 'next/dist/build/output';

/**
 * Build the next js application
 * @param handoff
 * @returns
 */
const buildApp = async (handoff: Handoff): Promise<void> => {
  const appPath = path.resolve(handoff.modulePath, 'src/app');
  const config = require(path.resolve(appPath, 'next.config.js'));
  // does a ts config exist?
  let tsconfigPath = 'tsconfig.json';

  config.typescript = {
    ...config.typescript,
    tsconfigPath,
  };
  console.log(config);
  return await build(path.resolve(handoff.modulePath, 'src/app'), config);
};

/**
 * Export the next js application
 * @param handoff
 * @returns
 */
export const exportNext = async (handoff: Handoff): Promise<void> => {
  const nextExportCliSpan = trace('next-export-cli');
  return await exportApp(
    path.resolve(handoff.modulePath, 'src/app'),
    {
      silent: false,
      threads: 1,
      outdir: path.resolve(handoff.workingPath, 'out'),
    },
    nextExportCliSpan
  );
};

/**
 * Watch the next js application
 * @param handoff
 */
export const watchApp = async (handoff: Handoff): Promise<void> => {
  const dir = path.resolve(handoff.modulePath, 'src/app');
  console.log(dir);
  startServer({
    allowRetry: true,
    dev: true,
    dir,
    hostname: '0.0.0.0',
    isNextDevCommand: true,
    port: 3000,
  })
    .then(async (app) => {
      const appUrl = `http://${app.hostname}:${app.port}`;
      startedDevelopmentServer(appUrl, `'0.0.0.0':3000`);
      // Start preflight after server is listening and ignore errors:
      // Finalize server bootup:
      await app.prepare();
    })
    .catch((err) => {
      if (err.code === 'EADDRINUSE') {
        let errorMessage = `Port 3000 is already in use.`;
        const pkgAppPath = require('next/dist/compiled/find-up').sync('package.json', {
          cwd: dir,
        });
        const appPackage = require(pkgAppPath);
        if (appPackage.scripts) {
          const nextScript = Object.entries(appPackage.scripts).find((scriptLine) => scriptLine[1] === 'next');
          if (nextScript) {
            errorMessage += `\nPlease free port 3000 before running Handoff.`;
          }
        }
        console.error(errorMessage);
      } else {
        console.error(err);
      }
      process.nextTick(() => process.exit(1));
    });
  // TODO: Build watch for all files
  // for (const CONFIG_FILE of CONFIG_FILES) {
  //   watchFile(path.join(dir, CONFIG_FILE), (cur: any, prev: any) => {
  //     if (cur.size > 0 || prev.size > 0) {
  //       console.log(
  //         `\n> Found a change in ${CONFIG_FILE}. Restart the server to see the changes in effect.`
  //       )
  //     }
  //   })
  // }
};

export default buildApp;
