import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../..';

export interface MakeComponentArgs extends SharedArgs {
  name: string;
}

const command: CommandModule<{}, MakeComponentArgs> = {
  command: 'make:component <name>',
  describe: 'Create a new html code component that you can embed in your documentation',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('name', {
      describe: '',
      type: 'string',
    });
  },
  handler: async (args: MakeComponentArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });

    const componentName = args.name;

    if (!/^[a-z0-9]+$/i.test(componentName)) {
      console.error(`Component name must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makeComponent(componentName);
  },
};

export default command;
