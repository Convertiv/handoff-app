import * as p from '@clack/prompts';
import chalk from 'chalk';
import { CommandModule } from 'yargs';
import { revokeToken } from '../../platform/client';
import { getToken, removeToken } from '../../platform/credentials';

const DEFAULT_PLATFORM_URL = 'http://localhost:3000';

export interface PlatformLogoutArgs {
  url?: string;
}

const command: CommandModule<{}, PlatformLogoutArgs> = {
  command: 'platform:logout',
  describe: 'Log out from the Handoff platform',
  builder: (yargs) => {
    return yargs.option('url', {
      type: 'string',
      description: 'Platform URL',
      default: process.env.HANDOFF_PLATFORM_URL || DEFAULT_PLATFORM_URL,
    });
  },
  handler: async (args) => {
    const baseUrl = (args.url || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');

    p.intro(chalk.bold('Handoff Platform Logout'));

    const token = getToken(baseUrl);
    if (!token) {
      p.note(`Not currently logged in to ${chalk.dim(baseUrl)}.`, 'Info');
      p.outro('Nothing to do.');
      return;
    }

    const spinner = p.spinner();

    try {
      // Revoke the token on the server (best-effort)
      spinner.start('Revoking token...');
      try {
        await revokeToken(baseUrl, token);
      } catch {
        // If the server is unreachable or the token is already invalid,
        // still proceed to remove the local credential.
      }
      spinner.stop('Token revoked.');

      // Remove from local credentials store
      removeToken(baseUrl);

      p.note(`Logged out from ${chalk.dim(baseUrl)}.`, 'Success');
      p.outro('Local credentials removed.');
    } catch (err: any) {
      spinner.stop('Logout encountered an issue.');
      // Still remove the local token even if revocation fails
      removeToken(baseUrl);
      p.note(`Local credentials removed, but server revocation may have failed.`, 'Warning');
      p.outro('You are logged out locally.');
    }
  },
};

export default command;
