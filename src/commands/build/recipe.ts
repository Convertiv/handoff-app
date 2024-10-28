import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface BuildRecipeArgs extends SharedArgs {}

const command: CommandModule<{}, BuildRecipeArgs> = {
  command: 'build:recipe',
  describe: false,
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: BuildRecipeArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.recipe();
  },
};

export default command;
