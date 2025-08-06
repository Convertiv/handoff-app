import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface EjectSchemasArgs extends SharedArgs {}

const command: CommandModule<{}, EjectSchemasArgs> = {
  command: 'eject:schemas',
  describe: 'Eject the default exportable schemas to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectSchemasArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.ejectExportables();
  },
};

export default command;
