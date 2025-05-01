import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface FetchArgs extends SharedArgs {}

const command: CommandModule<{}, FetchArgs> = {
  command: 'fetch',
  describe: 'Fetch the design tokens',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: FetchArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.fetch();
  },
};

export default command;
