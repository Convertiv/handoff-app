import config from './client-config';
import type { Config } from './figma-exporter/src/config';

export const getConfig = () => {
  // Check to see if there is a config in the root of the project
  return { ...config } as unknown as Config;
};