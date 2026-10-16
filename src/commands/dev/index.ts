import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface DevArgs extends SharedArgs {}

const command: CommandModule<{}, DevArgs> = {
  command: 'dev',
  describe: 'Start the design system in development mode',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: DevArgs) => {
    const handoff = createHandoff(args);
    await handoff.dev();
  },
};

export default command;
