import path from 'path';

export interface ComponentSizeMap {
  figma: string;
  css: string;
}

/**
 * Get Config
 * @returns Config
 */
export const getFetchConfig = () => {
  let config;
  try {
    config = require('../../../client-config');
  } catch (e) {
    config = {};
  }

  // Check to see if there is a config in the root of the project
  const parsed = { ...config };

  return parsed;
};

/**
 * Map a component size to the right name
 * @param figma
 * @returns
 */
export const mapComponentSize = (figma: string): string => {
  const config = getFetchConfig();
  const map = config.componentSizeMap as ComponentSizeMap[];
  let size = map.find((size) => size.figma === figma);

  return size?.css ?? 'sm';
};
