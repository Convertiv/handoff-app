import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../..';

export interface RenameComponentArgs extends SharedArgs {
  source: string;
  destination: string;
}

const command: CommandModule<{}, RenameComponentArgs> = {
  command: 'rename:component <source> <destination>',
  describe: 'Rename a component from source to destination and update all references',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('source', {
        describe: 'Source component name',
        type: 'string',
      })
      .positional('destination', {
        describe: 'Destination component name',
        type: 'string',
      });
  },
  handler: async (args: RenameComponentArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.renameComponent(args.source, args.destination);
  },
};

export default command;
