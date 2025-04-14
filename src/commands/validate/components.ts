import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface ValidateComponentsArgs extends SharedArgs {}

const command: CommandModule<{}, ValidateComponentsArgs> = {
  command: 'validate:components',
  describe: 'Validate components in the design system',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: ValidateComponentsArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.validateComponents();
  },
};

export default command; 