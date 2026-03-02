import fs from 'fs-extra';
import path from 'path';
import { Config } from '../types/config';
import { defaultConfig } from './defaults';

/**
 * Loads the handoff configuration from the project root.
 *
 * Searches for config files in order: handoff.config.json, handoff.config.js, handoff.config.cjs.
 * Merges file config with any provided overrides, then applies defaults for missing values.
 *
 * @param configOverride - Optional partial config to override file-loaded values.
 * @returns The fully resolved Config object.
 */
export const initConfig = (configOverride?: Partial<Config>): Config => {
  let config = {};

  const possibleConfigFiles = ['handoff.config.json', 'handoff.config.js', 'handoff.config.cjs'];

  // Find the first existing config file
  const configFile = possibleConfigFiles.find((file) => fs.existsSync(path.resolve(process.cwd(), file)));

  if (configFile) {
    const configPath = path.resolve(process.cwd(), configFile);
    if (configFile.endsWith('.json')) {
      const defBuffer = fs.readFileSync(configPath);
      config = JSON.parse(defBuffer.toString()) as Config;
    } else if (configFile.endsWith('.js') || configFile.endsWith('.cjs')) {
      // Invalidate require cache to ensure fresh read
      delete require.cache[require.resolve(configPath)];
      const importedConfig = require(configPath);
      config = importedConfig.default || importedConfig;
    }
  }

  // Apply overrides if provided
  if (configOverride) {
    Object.keys(configOverride).forEach((key) => {
      const value = configOverride[key as keyof Config];
      if (value !== undefined) {
        config[key as keyof Config] = value;
      }
    });
  }

  const returnConfig = { ...defaultConfig(), ...config } as unknown as Config;
  return returnConfig;
};
