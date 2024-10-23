import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface StartArgs extends SharedArgs {}

const command: CommandModule<{}, StartArgs> = {
  command: 'start',
  describe: 'Start the design system in development mode',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: StartArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.start();
  },
};

export default command;
