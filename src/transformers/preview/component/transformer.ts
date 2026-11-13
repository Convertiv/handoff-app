import Handoff from '../../../index';
import processComponents from './builder';
import { buildMainCss } from './css';
import { buildMainJS } from './javascript';
import writeComponentSummaryAPI from './summary';

export async function componentTransformer(handoff: Handoff) {
  // Shared artifacts build first: preview HTML references them only when they exist, so a failed
  // global build leaves no dangling reference.
  await buildMainJS(handoff);
  await buildMainCss(handoff);
  const componentData = await processComponents(handoff, undefined, undefined, { failOnError: true });
  await writeComponentSummaryAPI(handoff, componentData);
}
