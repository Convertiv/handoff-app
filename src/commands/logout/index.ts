import { CommandModule } from 'yargs';
import Handoff from '../../';
import { revokeAccessToken } from '../../cli/auth/device';
import { clearCliAuth, cliAuthFilePath, cliAuthMatchesRegistry, normalizeRegistryUrl, readCliAuth } from '../../cli/auth/store';
import { Logger } from '../../utils/logger';
import { SharedArgs } from '../types';
import { getSharedOptions } from '../utils';

export interface LogoutArgs extends SharedArgs {
  url?: string;
}

const command: CommandModule<{}, LogoutArgs> = {
  command: 'logout',
  describe: 'Revoke and remove saved registry credentials',
  builder: (yargs) =>
    getSharedOptions(yargs).option('url', {
      type: 'string',
      describe: 'Revoke credentials only when they belong to this exact registry URL',
    }),
  handler: async (args: LogoutArgs) => {
    const handoff = new Handoff(args.debug, args.force);
    const auth = await readCliAuth(handoff.workingPath);
    if (args.url && auth && !cliAuthMatchesRegistry(auth, args.url)) {
      Logger.error(`The saved login belongs to ${auth.remoteUrl}, not ${normalizeRegistryUrl(args.url)}. No credentials were changed.`);
      process.exitCode = 1;
      return;
    }

    if (auth) {
      try {
        await revokeAccessToken(auth);
      } catch (error) {
        Logger.warn(
          `Could not revoke the registry token remotely (${error instanceof Error ? error.message : String(error)}). ` +
            'It will still be removed from this workspace.'
        );
      }
    }

    try {
      await clearCliAuth(handoff.workingPath);
      Logger.success(`Logged out. Removed ${cliAuthFilePath(handoff.workingPath)}.`);
    } catch (error) {
      Logger.error(`Could not remove saved credentials: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  },
};

export default command;
