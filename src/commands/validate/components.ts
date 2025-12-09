import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface ValidateComponentsArgs extends SharedArgs {
  skipBuild?: boolean;
}

const command: CommandModule<{}, ValidateComponentsArgs> = {
  command: 'validate:components',
  describe: 'Validate components in the design system',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .option('skip-build', {
        describe: 'Skip build step before validating components',
        type: 'boolean',
        default: false,
      });
  },
  handler: async (args: ValidateComponentsArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.validateComponents(args.skipBuild ?? false);
  },
};

export default command;
