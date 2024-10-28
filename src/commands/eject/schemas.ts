import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectSchemasArgs extends SharedArgs {}

const command: CommandModule<{}, EjectSchemasArgs> = {
  command: 'eject:schemas',
  describe: 'Eject the default exportable schemas to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectSchemasArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectExportables();
  },
};

export default command;
