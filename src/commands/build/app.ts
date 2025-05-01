import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface BuildAppArgs extends SharedArgs {}

const command: CommandModule<{}, BuildAppArgs> = {
  command: 'build:app',
  describe: 'Build the documentation application',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: BuildAppArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.build();
  },
};

export default command;
