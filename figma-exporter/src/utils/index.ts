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
 * Derive the path to the integration
 */
export const getPathToIntegration = () => {
  const integrationFolder = 'integrations';
  const defaultIntegration = 'bootstrap';
  const defaultVersion = '5.2';

  const defaultPath = path.resolve(path.join(integrationFolder, defaultIntegration, defaultVersion));

  const config = getConfig();
  if (config.integration) {
    const searchPath = path.resolve(path.join(integrationFolder, config.integration.name, config.integration.version));
    if (!fs.existsSync(searchPath)) {
      console.log(chalk.red(`The requested integration was ${config.integration.name} version ${config.integration.version} but no integration plugin with that name was found`));
      throw Error('Could not find requested integration');
    }
    return searchPath;
  }
  // TODO: Allow custom integrations
  // TODO: Allow customers to

  return defaultPath;
}
