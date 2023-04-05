import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
/**
 * Generate slug from string
 * @param str
 * @returns
 */
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '-')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');


/**
 *  Filters out null values
 * @param value
 * @returns
 */
export const filterOutNull = <T>(value: T): value is NonNullable<T> => value !== null;

/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
export const filterOutUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined;

export interface ComponentSizeMap {
  figma: string;
  css: string;
}
/**
 * Default list of component sizes
 * TODO: Make this configurable
 */
export const componentSizeMap: ComponentSizeMap[] = [
  {
    figma: 'small',
    css: 'sm',
  },
  {
    figma: 'medium',
    css: 'md',
  },
  {
    figma: 'large',
    css: 'lg',
  },
];

/**
 * Map a component size to the right name
 * @param figma
 * @returns
 */
export const mapComponentSize = (figma: string): string => {
  let size = componentSizeMap.find((size) => size.figma === figma);

  return size?.css ?? 'sm';
}

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
  console.log(config)
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
      console.log(chalk.red(`The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`));
      throw Error('Could not find requested integration');
    }
    return searchPath;
  }
  // TODO: Allow customers to

  return defaultPath;
}

/**
 * Get Config
 * @returns Config
 */
export const getFetchConfig = () => {
  const config = require('../../../client-config')
  // Check to see if there is a config in the root of the project
  const parsed = { ...config };

  return parsed;
};
