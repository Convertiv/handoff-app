import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface DevArgs extends SharedArgs {}

const command: CommandModule<{}, DevArgs> = {
  command: 'dev',
  describe: 'Start the design system in development mode',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: DevArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.dev();
  },
};

export default command;
