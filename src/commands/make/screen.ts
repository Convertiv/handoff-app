import path from 'path';
import { CommandModule } from 'yargs';
import { scaffoldScreen } from '../../screens/build/scaffold';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface MakeScreenArgs extends SharedArgs {
  id: string;
}

const command: CommandModule<{}, MakeScreenArgs> = {
  command: 'make:screen <id>',
  describe: 'Create a screen with a sample collection, an assistant tool and a layout',
  builder: (yargs) =>
    getSharedOptions(yargs).positional('id', {
      describe: 'The screen id, used in its route /screens/<id>. Lowercase letters, digits and "-".',
      type: 'string',
    }),

  handler: async (args: MakeScreenArgs) => {
    const handoff = createHandoff(args);
    try {
      const result = await scaffoldScreen({
        id: args.id,
        workingPath: handoff.workingPath,
        modulePath: handoff.modulePath,
        configPath: handoff.getMainConfigFilePath(),
      });
      Logger.success(
        `Created ${path.relative(handoff.workingPath, result.directory)} with ${result.files.map((file) => path.basename(file)).join(', ')}.`
      );
      if (result.declared) {
        Logger.success(`Added ${result.declaration} to the screens in ${path.basename(handoff.getMainConfigFilePath()!)}.`);
      } else {
        Logger.warn(`Add the screen to your config: screens: [${result.declaration}]`);
      }
      Logger.info(`Run \`handoff-app start\` and open /screens/${args.id}.`);
    } catch (error) {
      Logger.error((error as Error).message);
      process.exitCode = 1;
    }
  },
};

export default command;
