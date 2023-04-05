import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Get Config
 * @returns Config
 */
export const getFetchConfig = () => {
    let config;
  try {
    config = require('../../client-config');
  } catch (e) {
    config = {};
  }

  // Check to see if there is a config in the root of the project
  const parsed = { ...config };

  return parsed;
};

/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
export const getPathToIntegration = () => {
  const integrationFolder = 'integrations';
  const defaultIntegration = 'bootstrap';
  const defaultVersion = '5.2';

  const defaultPath = path.resolve(path.join(integrationFolder, defaultIntegration, defaultVersion));

  const config = getFetchConfig();
  if (config.integration) {
    if (config.integration === 'custom') {
      // Look for a custom integration
      const customPath = path.resolve(path.join(integrationFolder, 'custom'));
      if (!fs.existsSync(customPath)) {
        console.log(chalk.red(`The config is set to use a custom integration but no custom integration found at integrations/custom`));
        throw Error('Could not find requested integration');
      }
      return customPath;
    }
    const searchPath = path.resolve(path.join(integrationFolder, config.integration.name, config.integration.version));
    if (!fs.existsSync(searchPath)) {
      console.log(
        chalk.red(
          `The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`
        )
      );
      throw Error('Could not find requested integration');
    }
    return searchPath;
  }
  // TODO: Allow customers to

  return defaultPath;
};
