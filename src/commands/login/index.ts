import { CommandModule } from 'yargs';
import { loginWithDevice } from '../../cli/auth/device';
import { cliAuthFilePath, DEFAULT_LOGIN_PROFILE, readCliAuth } from '../../cli/auth/store';
import { resolveRegistryConnection } from '../../registry/connection';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface LoginArgs extends SharedArgs {
  url?: string;
  browser?: boolean;
}

/**
 * Saves one registry credential per profile, so a workspace can hold a login for every registry it
 * publishes to. The name is independent of the config profiles, and `login` is the one command that
 * accepts a profile nothing else knows yet.
 */
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
    const handoff = createHandoff(args, { profileWithoutConfig: 'any' });
    const profile = handoff.getProfile() ?? DEFAULT_LOGIN_PROFILE;
    try {
      const configured = resolveRegistryConnection(handoff.config);
      // Resolved in the order publish and checkout use, so a login always targets the registry those
      // commands would reach.
      const saved = await readCliAuth(handoff.workingPath, profile);
      const remoteUrl = args.url?.trim() || configured.url || saved?.remoteUrl;
      if (!remoteUrl) {
        throw new Error(`Pass --url <registry-url>, configure runtime.registryConnection.url, or set "${configured.urlEnv}".`);
      }

      await loginWithDevice(handoff.workingPath, remoteUrl, { openBrowser: args.browser !== false, profile });
      const named = profile === DEFAULT_LOGIN_PROFILE ? '' : ` under profile "${profile}"`;
      Logger.success(`Logged in. Credentials saved to ${cliAuthFilePath(handoff.workingPath)}${named}.`);
      Logger.info(
        profile === DEFAULT_LOGIN_PROFILE
          ? 'Publish and checkout commands will use this login for the matching registry URL.'
          : `Publish and checkout commands will use this login when they run with --profile ${profile}.`
      );
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  },
};

export default command;
