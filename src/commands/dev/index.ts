import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface DevArgs extends SharedArgs {}

const command: CommandModule<{}, DevArgs> = {
  command: 'dev',
  describe: 'Start the design system in development mode',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: DevArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.dev();
  },
};

export default command;
