import { Types as HandoffTypes } from 'handoff-core';
import Handoff from '.';
import { writeAssets } from './exporters/assets';

export const createDocumentationObject = async (handoff: Handoff): Promise<HandoffTypes.IDocumentationObject> => {
  const runner = await handoff.getRunner();

  const localStyles = await runner.extractLocalStyles();

  const icons = await runner.extractAssets('Icons');
  await writeAssets(handoff, icons, 'icons');

  const logos = await runner.extractAssets('Logo');
  await writeAssets(handoff, logos, 'logos');

  const components = await runner.extractComponents(localStyles);

  return {
    timestamp: new Date().toISOString(),
    localStyles,
    components,
    assets: {
      icons,
      logos,
    },
  };
};
