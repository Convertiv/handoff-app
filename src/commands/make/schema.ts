import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface MakeSchemaArgs extends SharedArgs {
  type: string;
  name: string;
}

const command: CommandModule<{}, MakeSchemaArgs> = {
  command: 'make:schema <type> <name>',
  describe: 'Create a new exportable schema',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('type', {
        describe: '',
        type: 'string',
      })
      .positional('name', {
        describe: '',
        type: 'string',
      });
  },
  handler: async (args: MakeSchemaArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });

    const type = args.type;
    const name = args.name;

    if (!/^[a-z0-9]+$/i.test(name)) {
      console.error(`Exportable name must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makeExportable(type, name);
  },
};

export default command;
