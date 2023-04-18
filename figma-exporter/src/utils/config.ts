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
    config = require(path.resolve(__dirname, '../../client-config'));
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
export const mapComponentSize = (figma: string, component?: string): string => {

  const config = getFetchConfig();
  if (component) {
    if (config.figma.components[component]?.size) {
      const componentMap = config.components[component]?.size as ComponentSizeMap[];
      const componentSize = componentMap.find((size) => size.figma === figma);
      if (componentSize && componentSize?.css) {
        return componentSize?.css;
      }
    }
  }
  const coreMap = config.figma.size as ComponentSizeMap[];
  const size = coreMap.find((size) => size.figma === figma);
  return size?.css ?? figma;
};
