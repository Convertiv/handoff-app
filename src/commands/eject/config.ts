import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectConfigArgs extends SharedArgs {}

const command: CommandModule<{}, EjectConfigArgs> = {
  command: 'eject:config',
  describe: 'Eject the default configuration to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectConfigArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectConfig();
  },
};

export default command;
