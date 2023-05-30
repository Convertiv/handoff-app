import path from 'path';

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