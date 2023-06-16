#! /usr/bin/env node

import arg from 'arg';
import Handoff from '.';

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
  fetch [opts] - Fetches the design tokens from the design system
  build [opts] - Builds the design system
  build:integration [opts] - Builds the design system integration
  start [opts] - Starts the design system in development mode

  make
    make:schema <name> [opts] - Creates a new schema
    make:template <component> <state> [opts] - Creates a new template
    make:page <component> <state> [opts] - Creates a new page

  eject - Ejects the default configuration to the current directory
    eject:config [opts] - Ejects the default configuration to the current directory
    eject:integration [opts] - Ejects the default integration to the current directory
    eject:exportables [opts] - Ejects the default exportables to the current directory
    eject:pages [opts] - Ejects the default pages to the current directory

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
 * Show the help message
 */
const showVersion = () => {
  cliError('Handoff App - v0.5.1', 2);
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
let watching = false;
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
    if (args['--version']) {
      return showVersion();
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
        await handoff.build();
        await handoff.exportApp();
        return handoff;
      case 'start':
        watching = true;
        return handoff.start();
      case 'build:integration':
        return handoff.integration();
      case 'eject':
        cliError(
          `Eject commands will eject the default configuration into the working directory so you can customize it. \n\nEject must have a subcommand. Did you mean: \n  - eject:config \n  - eject:exportables.\n  - eject:integration\n  - eject:docs.`,
          2
        );
      case 'eject:config':
        return handoff.ejectConfig();
    }
  } catch (e: any) {
    if (e.message.indexOf('Unknown or unexpected option') === -1) throw e;
    return cliError(e.message + `\n${usage}`, 2);
  }
};

run(process.argv.slice(2), process.stdout, process.stderr)
  .then(() => {
    if (!watching) {
      process.exit(0);
    }
  })
  .catch((e) => {
    if (!e.silent) console.error(e.messageOnly ? e.message : e);
    process.exit(e.exitCode || 1);
  });
