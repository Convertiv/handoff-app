import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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