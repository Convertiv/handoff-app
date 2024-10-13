import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface BuildAppArgs extends SharedArgs {}

const command: CommandModule<{}, BuildAppArgs> = {
  command: 'build:app',
  describe: 'Build the documentation application',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: BuildAppArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.build();
  },
};

export default command;
