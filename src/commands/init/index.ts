import { CommandModule } from 'yargs';
import create from '../../create';

export interface InitArgs {}

const command: CommandModule<{}, InitArgs> = {
  command: 'init',
  describe: 'Initialize a new Handoff project with interactive wizard',
  builder: (yargs) => {
    return yargs;
  },
  handler: async () => {
    await create();
  },
};

export default command;
