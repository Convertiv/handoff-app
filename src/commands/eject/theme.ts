import { CommandModule } from 'yargs';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface EjectThemeArgs extends SharedArgs {}

const command: CommandModule<{}, EjectThemeArgs> = {
  command: 'eject:theme',
  describe: 'Eject the currently selected theme',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: EjectThemeArgs) => {
    const handoff = createHandoff(args);
    await handoff.ejectTheme();
  },
};

export default command;
