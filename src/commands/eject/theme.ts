import { CommandModule } from 'yargs';
import { getSharedOptions } from '../utils';
import { SharedArgs } from '../types';
import Handoff from '../../';

export interface EjectThemeArgs extends SharedArgs {}

const command: CommandModule<{}, EjectThemeArgs> = {
  command: 'eject:theme',
  describe: 'Eject the currently selected theme',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectThemeArgs) => {
    const handoff = new Handoff(args.debug, args.force, { integrationPath: args.integration });
    await handoff.ejectTheme();
  },
};

export default command;
