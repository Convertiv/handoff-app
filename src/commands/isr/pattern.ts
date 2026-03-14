import { CommandModule } from 'yargs';
import Handoff from '../../';
import {
  resolvePatternAffectedOutputPathsBatch,
} from '../../app-builder/isr-paths';
import { processPatterns } from '../../transformers/preview/pattern/builder';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface IsrPatternArgs extends SharedArgs {
  id?: string;
  ids?: string[];
  partial?: boolean;
  deployDir?: string;
}

const command: CommandModule<{}, IsrPatternArgs> = {
  command: 'isr:pattern',
  describe:
    'ISR for pattern changes: rebuild one or more patterns, then rebuild app and optionally deploy only affected routes',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('id', {
        describe: 'Pattern ID to rebuild (e.g. boilerplate)',
        type: 'string',
      })
      .option('ids', {
        describe: 'Comma-separated pattern IDs to rebuild',
        type: 'string',
        coerce: (arg: string) => (arg ? arg.split(',').map((p) => p.trim()) : []),
      })
      .option('partial', {
        describe: 'Partial deploy: copy only affected pattern output files into existing site output',
        type: 'boolean',
        default: false,
      })
      .option('deploy-dir', {
        describe: 'Copy output to this directory instead of default site output',
        type: 'string',
      });
  },
  handler: async (args: IsrPatternArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    handoff.init();

    const ids: string[] = args.id ? [args.id] : args.ids ?? [];
    if (ids.length === 0) {
      throw new Error('Either --id or --ids is required');
    }

    for (const id of ids) {
      await processPatterns(handoff, id);
    }

    const copyOnlyPaths = args.partial
      ? resolvePatternAffectedOutputPathsBatch(ids)
      : undefined;

    const buildOptions =
      copyOnlyPaths?.length || args.deployDir
        ? { copyOnlyPaths: copyOnlyPaths?.length ? copyOnlyPaths : undefined, deployDir: args.deployDir }
        : undefined;

    await handoff.build(true, buildOptions);
  },
};

export default command;
