import fs from 'fs';
import { Types as HandoffTypes } from 'handoff-core';
import path from 'path';
import Handoff from '.';
import { getAPIPath } from './transformers/preview/component/api';
import { generateSvgSprite, generateSpriteManifest } from './transformers/utils/svg-sprite';
import { Logger } from './utils/logger';

export const createDocumentationObject = async (handoff: Handoff): Promise<HandoffTypes.IDocumentationObject> => {
  const runner = await handoff.getRunner();

  const localStyles = await runner.extractLocalStyles();

  const icons = await runner.extractAssets('Icons');
  await writeAssets(handoff, icons, 'icons');
  
  // Generate SVG sprite from icons
  await writeSvgSprite(handoff, icons);

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

/**
 * Generates and writes an SVG sprite from the extracted icons
 * The sprite is written to public/api/icons-sprite.svg
 * A manifest file is also written to public/api/icons-sprite-manifest.json
 */
const writeSvgSprite = async (handoff: Handoff, icons: HandoffTypes.IAssetObject[]) => {
  if (!icons || icons.length === 0) {
    Logger.warn('No icons found to generate sprite');
    return;
  }

  const apiPath = getAPIPath(handoff);
  
  // Ensure the API path exists
  if (!fs.existsSync(apiPath)) {
    fs.mkdirSync(apiPath, { recursive: true });
  }

  // Generate the SVG sprite
  const sprite = generateSvgSprite(icons);
  const spritePath = path.join(apiPath, 'icons-sprite.svg');
  fs.writeFileSync(spritePath, sprite);
  Logger.success(`Generated SVG sprite with ${icons.length} icons at ${spritePath}`);

  // Generate and write the sprite manifest
  const manifest = generateSpriteManifest(icons);
  const manifestPath = path.join(apiPath, 'icons-sprite-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  Logger.success(`Generated sprite manifest at ${manifestPath}`);
};
