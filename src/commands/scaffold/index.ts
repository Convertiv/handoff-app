import { CommandModule } from 'yargs';
import Handoff from '../..';
import { runScaffold } from '../../cli/scaffold';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface ScaffoldArgs extends SharedArgs {}

const command: CommandModule<{}, ScaffoldArgs> = {
  command: 'scaffold',
  describe: 'Scaffold component stubs for fetched Figma components',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: ScaffoldArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await runScaffold(handoff);
  },
};

export default command;

