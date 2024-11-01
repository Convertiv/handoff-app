#! /usr/bin/env node

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { commands } from './commands';

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
  return 'Handoff App - 0.15.0';
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

const run = () => {
  try {
    const yargsInstance = yargs(hideBin(process.argv));

    commands.forEach((command) => {
      yargsInstance.command(command);
    });

    yargsInstance.help().version(showVersion()).strict().parse();
  } catch (e: any) {
    if (e.message.indexOf('Unknown or unexpected option') === -1) throw e;
    return cliError(e.message, 2);
  }
};

run();
