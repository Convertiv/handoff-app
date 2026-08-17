import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface StartArgs extends SharedArgs {}

const command: CommandModule<{}, StartArgs> = {
  command: 'start',
  describe: 'Start the design system in development mode',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: StartArgs) => {
    const handoff = createHandoff(args);
    await handoff.start();
  },
};

export default command;
