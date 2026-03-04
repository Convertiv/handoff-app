import 'dotenv/config';
import Handoff from '..';
import buildApp from '../app-builder';
import { Logger } from '../utils/logger';
import { figmaExtract, validateFigmaAuth } from './figma';
import { buildCustomFonts, buildStyles } from './styles';
import { validateHandoffRequirements } from './validation';

// Re-exports used by other modules
export { readPrevJSONFile, zip, zipAssets } from './archive';
export { buildComponents } from './components';
export { buildPages } from './pages';

/**
 * Run the entire Figma data pipeline:
 * 1. Validate runtime requirements
 * 2. Validate/prompt for Figma auth
 * 3. Extract data from Figma
 * 4. Build custom fonts
 * 5. Build design token styles
 * 6. Optionally build the documentation app
 */
const pipeline = async (handoff: Handoff, build?: boolean) => {
  if (!handoff.config) {
    throw new Error('Handoff config not found');
  }
  Logger.success(`Starting Handoff Figma data pipeline. Checking for environment and config.`);
  await validateHandoffRequirements();
  await validateFigmaAuth(handoff);
  const documentationObject = await figmaExtract(handoff);
  await buildCustomFonts(handoff, documentationObject);
  await buildStyles(handoff, documentationObject);
  // await buildComponents(handoff);
  if (build) {
    await buildApp(handoff);
  }
};

export default pipeline;
