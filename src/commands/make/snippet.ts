import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface MakeSnippetArgs extends SharedArgs {
  name: string;
}

const command: CommandModule<{}, MakeSnippetArgs> = {
  command: 'make:snippet <name>',
  describe: 'Create a new html code snippet that you can embed in your documentation',
  builder: (yargs) => {
    return getSharedOptions(yargs).positional('name', {
      describe: '',
      type: 'string',
    });
  },
  handler: async (args: MakeSnippetArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });

    const snippetName = args.name;

    if (!/^[a-z0-9]+$/i.test(snippetName)) {
      console.error(`Snippet name must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makeSnippet(snippetName);
  },
};

export default command;
