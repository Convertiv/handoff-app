import { CommandModule } from 'yargs';
import { loginWithDevice } from '../../cli/auth/device';
import { cliAuthFilePath } from '../../cli/auth/store';
import { resolveRegistryConnection } from '../../registry/connection';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface LoginArgs extends SharedArgs {
  url?: string;
  browser?: boolean;
}

const command: CommandModule<{}, LoginArgs> = {
  command: 'login',
  describe: 'Sign in to a registry using browser device authorization',
  builder: (yargs) =>
    getSharedOptions(yargs)
      .option('url', {
        type: 'string',
        describe: 'Registry URL, including its base path when configured',
      })
      .option('browser', {
        type: 'boolean',
        default: true,
        describe: 'Open the approval URL in the default browser (disable with --no-browser)',
      }),
  handler: async (args: LoginArgs) => {
    const handoff = createHandoff(args);
    try {
      const configured = resolveRegistryConnection(handoff.config);
      const remoteUrl = args.url?.trim() || configured.url;
      if (!remoteUrl) {
        throw new Error(`Pass --url <registry-url>, configure runtime.registryConnection.url, or set "${configured.urlEnv}".`);
      }

      await loginWithDevice(handoff.workingPath, remoteUrl, { openBrowser: args.browser !== false });
      Logger.success(`Logged in. Credentials saved to ${cliAuthFilePath(handoff.workingPath)}.`);
      Logger.info('Publish and checkout commands will use this login for the matching registry URL.');
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
