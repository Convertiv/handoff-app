import Handoff from '..';
import { processPatterns } from '../transformers/preview/pattern/builder';

/**
 * Builds pattern previews by running the pattern processor.
 * Must be called after buildComponents so component outputs exist.
 */
export const buildPatterns = async (handoff: Handoff) => {
  await processPatterns(handoff);
};
