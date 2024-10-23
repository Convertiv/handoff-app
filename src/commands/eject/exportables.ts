import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectExportablesArgs extends SharedArgs {}

const command: CommandModule<{}, EjectExportablesArgs> = {
  command: 'eject:exportables',
  describe: false,
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectExportablesArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectExportables();
  },
};

export default command;
