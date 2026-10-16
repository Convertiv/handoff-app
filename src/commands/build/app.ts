import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface BuildAppArgs extends SharedArgs {
  skipComponents?: boolean;
}

const command: CommandModule<{}, BuildAppArgs> = {
  command: 'build:app',
  describe: 'Build the documentation application',
  builder: (yargs) => {
    return getSharedOptions(yargs).option('skip-components', {
      describe: 'Skip building components before building the app',
      type: 'boolean',
      default: false,
    });
  },
  handler: async (args: BuildAppArgs) => {
    const handoff = createHandoff(args);
    await handoff.build('static', args.skipComponents ?? false);
  },
};

export default command;
