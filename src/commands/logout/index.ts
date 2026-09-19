import { CommandModule } from 'yargs';
import { revokeAccessToken } from '../../cli/auth/device';
import {
  type CliAuth,
  clearAllCliAuth,
  clearCliAuth,
  cliAuthFilePath,
  cliAuthMatchesRegistry,
  DEFAULT_LOGIN_PROFILE,
  normalizeRegistryUrl,
  readCliAuth,
  readCliLogins,
} from '../../cli/auth/store';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { createHandoff, getSharedOptions } from '../utils';

export interface LogoutArgs extends SharedArgs {
  url?: string;
  all?: boolean;
}

/** Remote revocation is best effort: the local credential goes either way. */
const revoke = async (auth: CliAuth): Promise<void> => {
  try {
    await revokeAccessToken(auth);
  } catch (error) {
    Logger.warn(
      `Could not revoke the registry token for ${auth.remoteUrl} (${error instanceof Error ? error.message : String(error)}). ` +
        'It will still be removed from this workspace.'
    );
  }
};

/**
 * `handoff-app logout` removes the login of the selected profile, leaving every other profile signed
 * in. `--all` removes them all.
 */
const command: CommandModule<{}, LogoutArgs> = {
  command: 'logout',
  describe: 'Revoke and remove saved registry credentials',
  builder: (yargs) =>
    getSharedOptions(yargs)
      .option('url', {
        type: 'string',
        describe: 'Revoke credentials only when they belong to this exact registry URL',
      })
      .option('all', {
        type: 'boolean',
        describe: 'Revoke and remove the saved credentials for every profile',
      })
      .conflicts('all', 'url'),
  handler: async (args: LogoutArgs) => {
    const handoff = createHandoff(args, { profileWithoutConfig: 'saved-login' });
    const profile = handoff.getProfile() ?? DEFAULT_LOGIN_PROFILE;
    const named = profile === DEFAULT_LOGIN_PROFILE ? '' : ` for profile "${profile}"`;

    if (args.all) {
      const logins = await readCliLogins(handoff.workingPath);
      const names = Object.keys(logins);
      if (!names.length) {
        Logger.info('No saved logins.');
        return;
      }

      for (const name of names) {
        await revoke(logins[name]);
      }
      try {
        await clearAllCliAuth(handoff.workingPath);
        Logger.success(`Logged out of every saved profile: ${names.join(', ')}. Removed ${cliAuthFilePath(handoff.workingPath)}.`);
      } catch (error) {
        Logger.error(`Could not remove saved credentials: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      }
      return;
    }

    const auth = await readCliAuth(handoff.workingPath, profile);
    if (!auth) {
      Logger.info(`No saved login${named}.`);
      return;
    }
    if (args.url && !cliAuthMatchesRegistry(auth, args.url)) {
      Logger.error(
        `The saved login${named} belongs to ${auth.remoteUrl}, not ${normalizeRegistryUrl(args.url)}. No credentials were changed.`
      );
      process.exitCode = 1;
      return;
    }

    await revoke(auth);

    try {
      await clearCliAuth(handoff.workingPath, profile);
      Logger.success(`Logged out of ${auth.remoteUrl}${named}. Removed the saved credentials.`);
    } catch (error) {
      Logger.error(`Could not remove saved credentials: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  },
};

export default command;
