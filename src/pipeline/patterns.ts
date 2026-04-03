import Handoff from '..';
import { ProcessPatternsOptions, processPatterns } from '../transformers/preview/pattern/builder';

export type { ProcessPatternsOptions };

/**
 * Builds pattern previews by composing pre-built component preview HTML.
 * Must be called AFTER buildComponents.
 */
export const buildPatterns = async (handoff: Handoff, options?: ProcessPatternsOptions) => {
  await processPatterns(handoff, options);
};
