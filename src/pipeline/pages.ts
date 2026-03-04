import Handoff from '..';
import { processPages } from '../transformers/preview/page/builder';

/**
 * Builds page previews by running the page processor.
 * Must be called after buildComponents so component outputs exist.
 */
export const buildPages = async (handoff: Handoff) => {
  await processPages(handoff);
};
