import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface EjectPagesArgs extends SharedArgs {}

const command: CommandModule<{}, EjectPagesArgs> = {
  command: 'eject:pages',
  describe: 'Eject the default pages to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectPagesArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.ejectPages();
  },
};

export default command;
