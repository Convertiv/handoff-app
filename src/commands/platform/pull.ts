import * as p from '@clack/prompts';
import chalk from 'chalk';
import { CommandModule } from 'yargs';
import Handoff from '../../';
import { getToken } from '../../platform/credentials';
import { pullProject } from '../../platform/sync';

const DEFAULT_PLATFORM_URL = 'http://localhost:3000';

export interface PlatformPullArgs {
  url?: string;
  force?: boolean;
  debug?: boolean;
}

const command: CommandModule<{}, PlatformPullArgs> = {
  command: 'platform:pull',
  describe: 'Pull project files from the Handoff platform',
  builder: (yargs) => {
    return yargs
      .option('url', {
        type: 'string',
        description: 'Platform URL (overrides config)',
      })
      .option('force', {
        alias: 'f',
        type: 'boolean',
        description: 'Overwrite all local files and delete orphaned files',
        default: false,
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enable debug mode',
      });
  },
  handler: async (args) => {
    const handoff = new Handoff(args.debug, args.force);
    const config = handoff.config;

    const baseUrl = (args.url || config?.platformUrl || process.env.HANDOFF_PLATFORM_URL || DEFAULT_PLATFORM_URL).replace(/\/+$/, '');
    const projectId = config?.platformProjectId;

    p.intro(chalk.bold('Handoff Platform Pull'));

    if (!projectId) {
      p.cancel(`No project linked. Run ${chalk.cyan('handoff-app platform:init')} first.`);
      process.exit(1);
    }

    const token = getToken(baseUrl);
    if (!token) {
      p.cancel(`Not logged in to ${baseUrl}. Run ${chalk.cyan('handoff-app platform:login')} first.`);
      process.exit(1);
    }

    const spinner = p.spinner();

    try {
      spinner.start('Pulling from platform...');

      const result = await pullProject(baseUrl, token, projectId, handoff.workingPath, {
        force: args.force,
        onProgress: (msg) => spinner.message(msg),
      });

      spinner.stop('Pull complete.');

      const summary = [
        `Downloaded: ${chalk.green(String(result.downloaded.length))} file(s)`,
        `Unchanged: ${chalk.dim(String(result.unchanged.length))} file(s)`,
      ];

      if (result.deleted.length > 0) {
        summary.push(`Deleted: ${chalk.red(String(result.deleted.length))} file(s)`);
      }

      summary.push(`Sync version: ${chalk.cyan(String(result.version))}`);

      p.note(summary.join('\n'), 'Pull Summary');

      if (result.downloaded.length > 0) {
        p.log.info(chalk.dim('Downloaded files:'));
        for (const file of result.downloaded) {
          p.log.info(chalk.dim(`  + ${file}`));
        }
      }

      p.outro('Local project is up to date.');
    } catch (err: any) {
      spinner.stop('Pull failed.');
      p.cancel(err.message || 'Pull failed');
      process.exit(1);
    }
  },
};

export default command;
