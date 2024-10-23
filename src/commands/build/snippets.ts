import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface BuildSnippetsArgs extends SharedArgs {
  snippet?: string;
}

const command: CommandModule<{}, BuildSnippetsArgs> = {
  command: 'build:snippets [snippet]',
  describe: 'Build the current integration snippets. Pass a name to build a specific snippet.',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('snippet', {
      describe: '',
      type: 'string',
    });
  },
  handler: async (args: BuildSnippetsArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.snippet(args.snippet);
  },
};

export default command;