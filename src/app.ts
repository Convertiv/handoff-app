import build from 'next/dist/build/index';
import exportApp from 'next/dist/export/index';
import { trace } from 'next/dist/trace'
import { nextDev } from 'next/dist/cli/next-dev';
import Handoff from '.';
import path from 'path';

const buildApp = async (handoff: Handoff) => {
  return await build(path.resolve(handoff.modulePath, 'src/app'));
};

export const exportNext = async (handoff: Handoff) => {
  const nextExportCliSpan = trace('next-export-cli')
  return await exportApp(path.resolve(handoff.modulePath, 'src/app'), {
    silent: false,
    threads: 1,
    outdir: path.resolve(handoff.workingPath, 'out'),
  }, nextExportCliSpan);
};

export const watchApp = async (handoff: Handoff) => {
  nextDev([path.resolve(handoff.modulePath, 'src/app'), '-p', '3000']);
}

export default buildApp;
