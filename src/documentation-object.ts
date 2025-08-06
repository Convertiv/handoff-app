import fs from 'fs';
import { Types as HandoffTypes } from 'handoff-core';
import path from 'path';
import Handoff from '.';
import { getAPIPath } from './transformers/preview/component/api';

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

const writeAssets = async (handoff: Handoff, assets: HandoffTypes.IAssetObject[], type: 'logos' | 'icons') => {
  const assetPath = path.join(getAPIPath(handoff), 'assets');
  if (!fs.existsSync(assetPath)) fs.mkdirSync(assetPath, { recursive: true });
  // write json file
  fs.writeFileSync(path.join(assetPath, `${type}.json`), JSON.stringify(assets, null, 2));
  const assetFolder = path.join(assetPath, type);
  if (!fs.existsSync(assetFolder)) fs.mkdirSync(assetFolder, { recursive: true });
  assets.forEach((asset) => {
    fs.writeFileSync(path.join(assetFolder, asset.path), asset.data);
  });
};
