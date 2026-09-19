import { ResolvedConfig } from '../types/config';
import { Logger } from '../utils/logger';

/**
 * Validates that the configuration has the required Figma credentials.
 *
 * @param config - The config to validate.
 * @returns The validated config (same reference).
 * @throws {Error} If required Figma credentials are missing.
 */
export const validateConfig = (config: ResolvedConfig): ResolvedConfig => {
  // TODO: Check to see if the exported folder exists before we run start
  if (!config.figma_project_id) {
    Logger.error('Figma Project ID missing. Please set HANDOFF_FIGMA_PROJECT_ID or run "handoff-app fetch".');
    throw new Error('Cannot initialize configuration');
  }
  if (!config.dev_access_token) {
    Logger.error('Figma Access Token missing. Please set HANDOFF_DEV_ACCESS_TOKEN or run "handoff-app fetch".');
    throw new Error('Cannot initialize configuration');
  }
  return config;
};
