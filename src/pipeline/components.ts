import Handoff from '..';
import { componentTransformer } from '../transformers/preview/component/transformer';

/**
 * Builds component previews by running the component transformer.
 */
export const buildComponents = async (handoff: Handoff) => {
  await Promise.all([componentTransformer(handoff)]);
};
