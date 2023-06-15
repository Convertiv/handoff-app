import build from 'next/dist/build/index';
import exportApp from 'next/dist/export/index';
import { trace } from 'next/dist/trace';
import { nextDev } from 'next/dist/cli/next-dev';
import Handoff from '.';
import path from 'path';
import fs from 'fs-extra';

const buildApp = async (handoff: Handoff) => {
  const appPath = path.resolve(handoff.modulePath, 'src/app');
  const config = require(path.resolve(appPath, 'next.config.js'));
  // does a ts config exist?
  let tsconfigPath = 'tsconfig.json';
  // if(!fs.existsSync(path.resolve(handoff.workingPath, 'tsconfig.json'))) {
  //   tsconfigPath = path.join('node_modules', 'handoff-app', 'src/app', 'tsconfig.json');
  // }

  config.typescript = {
    ...config.typescript,
    tsconfigPath,
  };
  return await build(path.resolve(handoff.modulePath, 'src/app'), config);
};

export const exportNext = async (handoff: Handoff) => {
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
 *
 * @param handoff
 */
export const watchApp = async (handoff: Handoff) => {
  nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
};

export default buildApp;
