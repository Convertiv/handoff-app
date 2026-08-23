#! /usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { commands } from './commands';
import { HandoffConfigError } from './config';
import { Logger } from './utils/logger';

class HandoffCliError extends Error {
  exitCode: number;
  messageOnly: boolean;
  constructor(message?: string) {
    // 'Error' breaks prototype chain here
    super(message);
    this.exitCode = 1;
    this.messageOnly = false;
  }
}

/**
 * Show the help message
 */
const showVersion = () => {
  return 'Handoff App - 2.0.0';
};

/**
 * Define a CLI error
 * @param msg
 * @param exitCode
 */
const cliError = function (msg: string, exitCode = 1) {
  const err = new HandoffCliError(msg);
  err.messageOnly = true;
  err.exitCode = exitCode;
  throw err;
};

const run = async () => {
  try {
    const yargsInstance = yargs(hideBin(process.argv));

    commands.forEach((command) => {
      yargsInstance.command(command);
    });

    yargsInstance.fail((msg, error, instance) => {
      // A bad `-c` is the user's to fix: one actionable line, no usage dump and no stack trace.
      if (error instanceof HandoffConfigError) {
        Logger.error(error.message);
        process.exit(1);
      }
      // Anything else unexpected keeps its stack; usage errors keep yargs' help-then-message output.
      if (error) {
        throw error;
      }
      instance.showHelp();
      Logger.error(msg);
      process.exit(1);
    });

    // Awaited so a rejected async handler reaches the failure handling above.
    await yargsInstance.help().version(showVersion()).strict().parseAsync();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.indexOf('Unknown or unexpected option') === -1) throw e;
    return cliError(message, 2);
  }
};

run().catch((error: unknown) => {
  // User-facing failures are already reported above, so anything landing here is unexpected and
  // keeps its stack trace.
  console.error(error);
  process.exit(1);
});
