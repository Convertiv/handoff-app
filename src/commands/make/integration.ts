import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface MakeIntegrationArgs extends SharedArgs {}

const command: CommandModule<{}, MakeIntegrationArgs> = {
  command: 'make:integration',
  describe: 'Create the default integration to the current working directory',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: MakeIntegrationArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.makeIntegration();
  },
};

export default command;
