#! /usr/bin/env node

import arg from 'arg';
import Handoff from './handoff.js';

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

const usage = `Usage: handoff-app <cmd> <opts>

Commands:
  fetch [opts]
  build [opts]
  bootstrap [opts]

  make
    make:schema <name> [opts]
    make:template <component> <state> [opts]
    make:page <component> <state> [opts]

  export - Exports the default configuration to the current directory
    export:config [opts]
    export:integration [opts]
    export:schema [opts]
    export:pages [opts]

Options:
  -c, --config [file]      Define the path to the config file
  -d, --debug              Show debug logs
  -h, --help               Show this help message
  -v, --version            Show the version number
`;

/**
 * Show the help message
 */
const showHelp = () => {
  cliError(usage, 2);
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

const run = async (
  argv: string[],
  stdout: NodeJS.WriteStream & {
    fd: 1;
  },
  stderr: NodeJS.WriteStream & {
    fd: 2;
  }
) => {
  try {
    const args = arg(
      {
        '--help': Boolean,
        '-h': '--help',
        '--version': Boolean,
        '-v': '--version',
        '--config': String,
        '-c': '--config',
        '--debug': Boolean,
        '-d': '--debug',
      },
      {
        permissive: false,
        argv,
      }
    );
    if (args['--help']) {
      return showHelp();
    }
    const handoff = new Handoff();
    if (args['--debug']) {
      handoff.debug = true;
    }
    await handoff.init();
    switch (args._[0]) {
      case 'fetch':
        return handoff.fetch();
      case 'build':
        return handoff.build();
    }
  } catch (e: any) {
    if (e.message.indexOf('Unknown or unexpected option') === -1) throw e;
    return cliError(e.message + `\n${usage}`, 2);
  }
};

run(process.argv.slice(2), process.stdout, process.stderr)
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    if (!e.silent) console.error(e.messageOnly ? e.message : e);
    process.exit(e.exitCode || 1);
  });
