import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../..';

export interface BuildComponentsArgs extends SharedArgs {
  component?: string;
}

const command: CommandModule<{}, BuildComponentsArgs> = {
  command: 'build:components [component]',
  describe: 'Build the current integration components. Pass a name to build a specific component.',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('component', {
      describe: '',
      type: 'string',
    });
  },
  handler: async (args: BuildComponentsArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.component(args.component);
  },
};

export default command;