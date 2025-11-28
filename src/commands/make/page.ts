import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface MakePageArgs extends SharedArgs {
  name: string;
  parent?: string;
}

const command: CommandModule<{}, MakePageArgs> = {
  command: 'make:page <name> [parent]',
  describe: 'Create a new page',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('name', {
        describe: '',
        type: 'string',
      })
      .positional('parent', {
        describe: '',
        type: 'string',
      });
  },
  handler: async (args: MakePageArgs) => {
    const handoff = new Handoff(args.debug, args.force);

    const pageName = args.name;

    if (!/^[a-z0-9]+$/i.test(pageName)) {
      Logger.error(`Page name must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    let pageParent = args.parent;

    if (pageParent && !/^[a-z0-9]+$/i.test(pageParent)) {
      Logger.error(`Page parent must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makePage(pageName, pageParent);
  },
};

export default command;
