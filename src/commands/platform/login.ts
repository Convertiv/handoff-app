import * as p from '@clack/prompts';
import chalk from 'chalk';
import { exec } from 'child_process';
import { CommandModule } from 'yargs';
import { createDeviceCode, pollForToken } from '../../platform/client';
import { setToken } from '../../platform/credentials';

const DEFAULT_PLATFORM_URL = 'http://localhost:3000';

export interface PlatformLoginArgs {
  url?: string;
}

const command: CommandModule<{}, PlatformLoginArgs> = {
  command: 'platform:login',
  describe: 'Log in to the Handoff platform',
  builder: (yargs) => {
    return yargs.option('url', {
      type: 'string',
      description: 'Platform URL',
      default: process.env.HANDOFF_PLATFORM_URL || DEFAULT_PLATFORM_URL,
    });
  },
  handler: async (args) => {
    const baseUrl = (args.url || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');

    p.intro(chalk.bold('Handoff Platform Login'));

    const spinner = p.spinner();

    try {
      spinner.start('Initiating authentication...');
      const deviceCode = await createDeviceCode(baseUrl);
      spinner.stop('Authentication initiated.');

      // Display the user code prominently
      p.note(
        [
          `Your one-time code: ${chalk.bold.cyan(deviceCode.userCode)}`,
          '',
          `Open this URL to sign in:`,
          chalk.underline(`${deviceCode.verificationUrl}`),
        ].join('\n'),
        'Authentication'
      );

      // Try to open the browser automatically
      openBrowser(deviceCode.verificationUrl);

      spinner.start('Waiting for approval (this will open in your browser)...');
      const result = await pollForToken(baseUrl, deviceCode.deviceCode, deviceCode.interval, deviceCode.expiresIn);
      spinner.stop('Authentication approved!');

      // Store the token
      setToken(baseUrl, result.token, {
        name: result.user.name,
        email: result.user.email,
      });

      p.note(
        [
          `Logged in as ${chalk.bold(result.user.name || result.user.email)}`,
          `Platform: ${chalk.dim(baseUrl)}`,
        ].join('\n'),
        'Success'
      );

      p.outro('You can now use platform:init to link a project.');
    } catch (err: any) {
      spinner.stop('Authentication failed.');
      p.cancel(err.message || 'Login failed');
      process.exit(1);
    }
  },
};

/**
 * Attempt to open a URL in the default browser.
 * Fails silently — the user can always copy/paste the URL.
 */
function openBrowser(url: string): void {
  const command =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      // Silently ignore — user will use the printed URL
    }
  });
}

export default command;
