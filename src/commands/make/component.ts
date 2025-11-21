import { CommandModule } from 'yargs';
import Handoff from '../..';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface MakeComponentArgs extends SharedArgs {
  name: string;
}

const command: CommandModule<{}, MakeComponentArgs> = {
  command: 'make:component <name> <version>',
  describe: 'Create a new html code component that you can embed in your documentation',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('name', {
      describe: 'The name of the new component you are creating',
      type: 'string',
    });
  },

  handler: async (args: MakeComponentArgs) => {
    const handoff = new Handoff(args.debug, args.force);

    const componentName = args.name;
    const version = args.version;

    if (!/^[a-z0-9_-]+$/i.test(componentName)) {
      Logger.error(`Component name must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makeComponent(componentName);
  },
};

export default command;
