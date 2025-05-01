import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface EjectExportablesArgs extends SharedArgs {}

const command: CommandModule<{}, EjectExportablesArgs> = {
  command: 'eject:exportables',
  describe: false,
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectExportablesArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.ejectExportables();
  },
};

export default command;
