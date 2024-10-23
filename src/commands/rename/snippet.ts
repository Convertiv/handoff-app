import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface RenameSnippetArgs extends SharedArgs {
  source: string;
  destination: string;
}

const command: CommandModule<{}, RenameSnippetArgs> = {
  command: 'rename:snippet <source> <destination>',
  describe: 'Rename a snippet from source to destination and update all references',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('source', {
        describe: 'Source snippet name',
        type: 'string',
      })
      .positional('destination', {
        describe: 'Destination snippet name',
        type: 'string',
      });
  },
  handler: async (args: RenameSnippetArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.renameSnippet(args.source, args.destination);
  },
};

export default command;
