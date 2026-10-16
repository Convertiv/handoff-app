import { CommandModule } from 'yargs';
import { runScaffold } from '../../cli/scaffold';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface ScaffoldArgs extends SharedArgs {}

const command: CommandModule<{}, ScaffoldArgs> = {
  command: 'scaffold',
  describe: 'Scaffold component stubs for fetched Figma components',
  builder: (yargs) => {
    return getSharedOptions(yargs);
  },
  handler: async (args: ScaffoldArgs) => {
    const handoff = createHandoff(args);
    await runScaffold(handoff);
  },
};

export default command;

