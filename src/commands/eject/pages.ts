import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface EjectPagesArgs extends SharedArgs {}

const command: CommandModule<{}, EjectPagesArgs> = {
  command: 'eject:pages',
  describe: 'Eject the default pages to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectPagesArgs) => {
    const handoff = createHandoff(args);
    await handoff.ejectPages();
  },
};

export default command;
