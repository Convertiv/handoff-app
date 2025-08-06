import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface MakeExportableArgs extends SharedArgs {
  type: string;
  name: string;
}

const command: CommandModule<{}, MakeExportableArgs> = {
  command: 'make:exportable <type> <name>',
  describe: false,
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
  handler: async (args: MakeExportableArgs) => {
    const handoff = new Handoff(args.debug, args.force);

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
