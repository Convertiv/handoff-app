import build from 'next/dist/build/index';
import exportApp from 'next/dist/export/index';
import { trace } from 'next/dist/trace';
import { nextDev } from 'next/dist/cli/next-dev';
import Handoff from '.';
import path from 'path';

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
  return await nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
};

export default buildApp;
