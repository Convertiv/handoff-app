import { CommandModule } from 'yargs';
import Handoff from '../../';
import { resolveAffectedOutputPaths } from '../../app-builder/isr-paths';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface IsrPagesArgs extends SharedArgs {
  path?: string;
  paths?: string[];
  menuChanged?: boolean;
  partial?: boolean;
  deployDir?: string;
}

const command: CommandModule<{}, IsrPagesArgs> = {
  command: 'isr:pages',
  describe: 'ISR for page changes: rebuild app (skip components) and optionally deploy only affected routes',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('path', {
        describe: 'Single route path to invalidate (e.g. /guidelines or foundations/colors)',
        type: 'string',
      })
      .option('paths', {
        describe: 'Comma-separated route paths to invalidate',
        type: 'string',
        coerce: (arg: string) => (arg ? arg.split(',').map((p) => p.trim()) : []),
      })
      .option('menu-changed', {
        describe: 'Treat as menu change: regenerate all menu-linked routes',
        type: 'boolean',
        default: false,
      })
      .option('partial', {
        describe: 'Partial deploy: copy only affected output files into existing site output',
        type: 'boolean',
        default: false,
      })
      .option('deploy-dir', {
        describe: 'Copy output to this directory instead of default site output',
        type: 'string',
      });
  },
  handler: async (args: IsrPagesArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    handoff.init();

    const usePartial =
      args.partial && (args.path != null || (args.paths && args.paths.length > 0) || args.menuChanged);

    const copyOnlyPaths = usePartial
      ? resolveAffectedOutputPaths(handoff, {
          path: args.path,
          paths: args.paths,
          menuChanged: args.menuChanged,
        })
      : undefined;

    const buildOptions =
      copyOnlyPaths?.length || args.deployDir
        ? { copyOnlyPaths: copyOnlyPaths?.length ? copyOnlyPaths : undefined, deployDir: args.deployDir }
        : undefined;

    await handoff.build(true, buildOptions);
  },
};

export default command;
