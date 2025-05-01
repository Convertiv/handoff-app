import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface EjectConfigArgs extends SharedArgs {}

const command: CommandModule<{}, EjectConfigArgs> = {
  command: 'eject:config',
  describe: 'Eject the default configuration to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectConfigArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.ejectConfig();
  },
};

export default command;
