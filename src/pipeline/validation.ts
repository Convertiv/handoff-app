import { Logger } from '../utils/logger';

/**
 * Validates that the Node.js runtime meets the minimum version requirements.
 *
 * @throws {Error} If Node.js version is below 16.
 */
export const validateHandoffRequirements = async () => {
  let requirements = false;
  const result = process.versions;
  if (result && result.node) {
    if (parseInt(result.node) >= 16) {
      requirements = true;
    }
  } else {
    // couldn't find the right version, but ...
  }
  if (!requirements) {
    Logger.error('Handoff installation failed.');
    Logger.warn(
      '- Please update node to at least Node 16 https://nodejs.org/en/download. \n- You can read more about installing handoff at https://www.handoff.com/docs/'
    );
    throw new Error('Could not run handoff');
  }
};
