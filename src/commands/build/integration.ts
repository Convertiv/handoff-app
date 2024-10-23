import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface BuildIntegrationArgs extends SharedArgs {}

const command: CommandModule<{}, BuildIntegrationArgs> = {
  command: 'build:integration',
  describe: 'Build the integration, styles and previews',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: BuildIntegrationArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.integration();
  },
};

export default command;
