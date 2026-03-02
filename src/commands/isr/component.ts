import { CommandModule } from 'yargs';
import Handoff from '../../';
import {
  resolveComponentAffectedOutputPathsBatch,
} from '../../app-builder/isr-paths';
import processComponents from '../../transformers/preview/component/builder';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface IsrComponentArgs extends SharedArgs {
  id?: string;
  ids?: string[];
  partial?: boolean;
  deployDir?: string;
}

const command: CommandModule<{}, IsrComponentArgs> = {
  command: 'isr:component',
  describe:
    'ISR for component changes: rebuild one or more components, then rebuild app and optionally deploy only affected routes',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('id', {
        describe: 'Component ID to rebuild (e.g. button)',
        type: 'string',
      })
      .option('ids', {
        describe: 'Comma-separated component IDs to rebuild',
        type: 'string',
        coerce: (arg: string) => (arg ? arg.split(',').map((p) => p.trim()) : []),
      })
      .option('partial', {
        describe: 'Partial deploy: copy only affected component output files into existing site output',
        type: 'boolean',
        default: false,
      })
      .option('deploy-dir', {
        describe: 'Copy output to this directory instead of default site output',
        type: 'string',
      });
  },
  handler: async (args: IsrComponentArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    handoff.init();

    const ids: string[] = args.id ? [args.id] : args.ids ?? [];
    if (ids.length === 0) {
      throw new Error('Either --id or --ids is required');
    }

    for (const id of ids) {
      await processComponents(handoff, id);
    }

    const copyOnlyPaths = args.partial
      ? resolveComponentAffectedOutputPathsBatch(ids)
      : undefined;

    const buildOptions =
      copyOnlyPaths?.length || args.deployDir
        ? { copyOnlyPaths: copyOnlyPaths?.length ? copyOnlyPaths : undefined, deployDir: args.deployDir }
        : undefined;

    await handoff.build(true, buildOptions);
  },
};

export default command;
