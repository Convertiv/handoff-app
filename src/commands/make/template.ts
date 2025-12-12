import { CommandModule } from 'yargs';
import Handoff from '../../';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface MakeTemplateArgs extends SharedArgs {
  component: string;
  state?: string;
}

const command: CommandModule<{}, MakeTemplateArgs> = {
  command: 'make:template <component> [state]',
  describe: 'Create a new template',
  builder: (yargs) => {
    return getSharedOptions(yargs)
      .positional('component', {
        describe: '',
        type: 'string',
      })
      .positional('state', {
        describe: '',
        type: 'string',
      });
  },
  handler: async (args: MakeTemplateArgs) => {
    const handoff = new Handoff(args.debug, args.force);

    const templateComponent = args.component;

    if (!/^[a-z0-9]+$/i.test(templateComponent)) {
      Logger.error(`Template component must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    let templateState = args.state;

    if (templateState && !/^[a-z0-9]+$/i.test(templateState)) {
      Logger.error(`Template state must be alphanumeric and may contain dashes or underscores`);
      return;
    }

    await handoff.makeTemplate(templateComponent, templateState);
  },
};

export default command;
