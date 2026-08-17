import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface EjectConfigArgs extends SharedArgs {}

const command: CommandModule<{}, EjectConfigArgs> = {
  command: 'eject:config',
  describe: 'Eject the default configuration to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectConfigArgs) => {
    const handoff = createHandoff(args);
    await handoff.ejectConfig();
  },
};

export default command;
