import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectIntegrationArgs extends SharedArgs {}

const command: CommandModule<{}, EjectIntegrationArgs> = {
  command: 'eject:integration',
  describe: false,
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectIntegrationArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectIntegration();
  },
};

export default command;
