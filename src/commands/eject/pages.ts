import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectPagesArgs extends SharedArgs {}

const command: CommandModule<{}, EjectPagesArgs> = {
  command: 'eject:pages',
  describe: 'Eject the default pages to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectPagesArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectPages();
  },
};

export default command;
