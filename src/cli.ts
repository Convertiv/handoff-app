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

  build - Using the current tokens, build various outputs
    build:app [opts] - Builds the design system static application
    build:integration [opts] - Builds current selected integration, styles and previews
    build:recipe - Builds a recipe file based on the integration that is curretnly used (if any)

  start [opts] - Starts the design system in development mode

  make
    make:exportable <type> <name> [opts] - Creates a new schema
    make:template <component> <state> [opts] - Creates a new template
    make:page <name> <parent> [opts] - Creates a new custom page
    make:integration - Creates a new integration based on the provided Bootstrap 5.3 template

  eject - Ejects the default entire configuration to the current directory
    eject:config [opts] - Ejects the default configuration to the current directory
    eject:integration [opts] - Ejects the default integration to the current directory
    eject:exportables [opts] - Ejects the default exportables to the current directory
    eject:pages [opts] - Ejects the default pages to the current directory
    eject:theme [opts] - Ejects the currently selected theme to theme/main.scss

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
  cliError('Handoff App - 0.13.2', 2);
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
        '--force': Boolean,
        '-f': '--force',
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
    if (args['--force']) {
      handoff.force = true;
    }
    switch (args._[0]) {
      case 'fetch':
        return handoff.fetch();
      case 'build:app':
        await handoff.build();
        return handoff;
      case 'start':
        watching = true;
        return handoff.start();
      case 'dev':
        watching = true;
        return handoff.dev();
      case 'build:integration':
        return handoff.integration();
      case 'build:recipe':
        return handoff.recipe();
      case 'eject':
        cliError(
          `Eject commands will eject the default configuration into the working directory so you can customize it.

Eject must have a subcommand. Did you mean:
  - eject:config
  - eject:exportables
  - eject:integration
  - eject:docs
  - eject:theme.`,
          2
        );
        break;
      case 'eject:config':
        return handoff.ejectConfig();
      case 'eject:integration':
        return handoff.ejectIntegration();
      case 'eject:exportables':
        return handoff.ejectExportables();
      case 'eject:theme':
        return handoff.ejectTheme();
      case 'eject:pages':
        return handoff.ejectPages();
      case 'make':
        cliError(
          `Make commands create configuration files in your working root and scaffold up the appropriate folder structure if needed.

  Make must have a subcommand. Did you mean:
    - make:template
    - make:exportable
    - make:page
    - make:integration`,
            2
          );
          break;
      case 'make:exportable':
        const type = args._[1];
        if (!type) {
          cliError(`You must specify a type of 'component' or 'foundation'`, 2);
        }
        const name = args._[2];
        if (!name) {
          cliError(`You must specify a name for the exportable`, 2);
        }
        if (!/^[a-z0-9]+$/i.test(name)) {
          cliError(`Exportable name must be alphanumeric and may contain dashes or underscores`, 2);
        }
        return handoff.makeExportable(type, name);
      case 'make:template':
        const templateComponent = args._[1];
        if (!templateComponent) {
          cliError(`You must supply a component name`, 2);
        }
        if (!/^[a-z0-9]+$/i.test(templateComponent)) {
          cliError(`Template component must be alphanumeric and may contain dashes or underscores`, 2);
        }
        let templateState = args._[2];
        if (templateState && !/^[a-z0-9]+$/i.test(templateComponent)) {
          cliError(`Template state must be alphanumeric and may contain dashes or underscores`, 2);
        }
        return handoff.makeTemplate(templateComponent, templateState);
      case 'make:page':
        const pageName = args._[1];
        if (!pageName) {
          cliError(`You must supply a page name`, 2);
        }
        if (!/^[a-z0-9]+$/i.test(pageName)) {
          cliError(`Page name must be alphanumeric and may contain dashes or underscores`, 2);
        }
        let pageParent = args._[2];
        if (pageParent && !/^[a-z0-9]+$/i.test(pageParent)) {
          cliError(`Page parent must be alphanumeric and may contain dashes or underscores`, 2);
        }
        return handoff.makePage(pageName, pageParent);
      case 'make:integration':
        return handoff.makeIntegration();
      default:
        return showHelp();
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
