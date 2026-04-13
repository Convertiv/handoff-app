import { CommandModule } from 'yargs';
import Handoff from '../..';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface BuildComponentsArgs extends SharedArgs {
  component?: string;
}

const command: CommandModule<{}, BuildComponentsArgs> = {
  command: 'build:components [component]',
  describe: 'Build the current project components. Pass a name to build a specific component.',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('component', {
      describe: 'The name of the component',
      type: 'string',
    });
  },
  handler: async (args: BuildComponentsArgs) => {
    const handoff = new Handoff(args.debug, args.force, undefined, args.verbose);
    await handoff.component(args.component);
  },
};

export default command;
