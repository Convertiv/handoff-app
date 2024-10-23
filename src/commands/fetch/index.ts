import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface FetchArgs extends SharedArgs {}

const command: CommandModule<{}, FetchArgs> = {
  command: 'fetch',
  describe: 'Fetch the design tokens',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: FetchArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.fetch();
  },
};

export default command;
