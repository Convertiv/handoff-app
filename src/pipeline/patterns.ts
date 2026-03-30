import Handoff from '..';
import { processPatterns } from '../transformers/preview/pattern/builder';

/**
 * Builds pattern previews by composing pre-built component preview HTML.
 * Must be called AFTER buildComponents.
 */
export const buildPatterns = async (handoff: Handoff) => {
  await processPatterns(handoff);
};
