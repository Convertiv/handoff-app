import { Argv } from 'yargs';

export const getSharedOptions = (yargs: Argv) => {
  return yargs.options({
    config: {
      alias: 'c',
      type: 'string',
      description: 'Path to config file',
    },
    force: {
      alias: 'f',
      type: 'boolean',
      description: 'Force action',
    },
    debug: {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug mode',
    },
  });
};