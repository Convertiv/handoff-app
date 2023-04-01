import config from './client-config';
import type { Config } from './client-config';

export const getFetchConfig = () => {
  // Check to see if there is a config in the root of the project
  const parsed = { ...config } as unknown as Config;

  return parsed;
};
