import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface FetchArgs extends SharedArgs {}

const command: CommandModule<{}, FetchArgs> = {
  command: 'fetch',
  describe: 'Fetch the design tokens',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: FetchArgs) => {
    const handoff = createHandoff(args);
    await handoff.fetch();
  },
};

export default command;
