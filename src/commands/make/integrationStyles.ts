import { CommandModule } from 'yargs';
import Handoff from '../..';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface MakeIntegrationStylesArgs extends SharedArgs {}

const command: CommandModule<{}, MakeIntegrationStylesArgs> = {
  command: 'make:integration:styles',
  describe: 'Builds the basic styles and scripts for the integration',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: MakeIntegrationStylesArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.makeIntegrationStyles();
  },
};

export default command;
