import { CommandModule } from 'yargs';
import Handoff from '../../';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface EjectThemeArgs extends SharedArgs {}

const command: CommandModule<{}, EjectThemeArgs> = {
  command: 'eject:theme',
  describe: 'Eject the currently selected theme',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectThemeArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    await handoff.ejectTheme();
  },
};

export default command;
