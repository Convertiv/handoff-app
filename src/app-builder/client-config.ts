import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { getClientConfig } from '../config';
import { Logger } from '../utils/logger';
import { getAppPath } from './paths';

/**
 * Publishes the tokens API files to the public directory.
 */
export const generateTokensApi = async (handoff: Handoff) => {
  const apiPath = path.resolve(path.join(handoff.workingPath, 'public/api'));

  await fs.ensureDir(apiPath);

  const tokens = await handoff.getDocumentationObject();

  // Early return if no tokens
  if (!tokens) {
    // Write empty tokens.json for API consistency
    await fs.writeJson(path.join(apiPath, 'tokens.json'), {}, { spaces: 2 });
    return;
  }

  await fs.writeJson(path.join(apiPath, 'tokens.json'), tokens, { spaces: 2 });

  const tokensDir = path.join(apiPath, 'tokens');
  await fs.ensureDir(tokensDir);

  // Only iterate if tokens has properties
  if (tokens && typeof tokens === 'object') {
    const promises: Promise<void>[] = [];
    for (const type in tokens) {
      if (type === 'timestamp' || !tokens[type] || typeof tokens[type] !== 'object') continue;
      for (const group in tokens[type]) {
        if (tokens[type][group]) {
          promises.push(fs.writeJson(path.join(tokensDir, `${group}.json`), tokens[type][group], { spaces: 2 }));
        }
      }
    }
    await Promise.all(promises);
  }
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg']);

async function scanDirectoryForAssets(dir: string, urlPrefix: string): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const assets: any[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subAssets = await scanDirectoryForAssets(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
      assets.push(...subAssets);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    const isImage = IMAGE_EXTENSIONS.has(ext);
    const isVideo = VIDEO_EXTENSIONS.has(ext);
    if (!isImage && !isVideo) continue;

    const nameWithoutExt = path.basename(entry.name, ext);
    const prettyName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    assets.push({
      id: `${urlPrefix}/${entry.name}`.replace(/^\//, '').replace(/\//g, '-'),
      name: prettyName,
      src: `${urlPrefix}/${entry.name}`,
      alt: prettyName,
      type: isImage ? 'image' : 'video',
      tags: [],
    });
  }

  return assets;
}

/**
 * Generates the playground assets API manifest.
 *
 * Looks for an explicit manifest at `config/assets.json` first.
 * Falls back to auto-scanning `public/assets/playground/` for media files.
 * Writes to `public/api/playground-assets.json`.
 */
export const generatePlaygroundAssetsApi = async (handoff: Handoff) => {
  const apiPath = path.resolve(handoff.workingPath, 'public/api');
  await fs.ensureDir(apiPath);
  const outputPath = path.join(apiPath, 'playground-assets.json');

  const manifestPath = path.resolve(handoff.workingPath, 'config/assets.json');
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath);
    await fs.writeJson(outputPath, manifest, { spaces: 2 });
    Logger.info('Playground assets manifest loaded from config/assets.json');
    return;
  }

  const scanDir = path.resolve(handoff.workingPath, 'public/assets/playground');
  Logger.info(`Scanning for playground assets in ${scanDir}`);
  if (!(await fs.pathExists(scanDir))) {
    Logger.info(`No playground assets found in ${scanDir}`);
    await fs.writeJson(outputPath, { assets: [] }, { spaces: 2 });
    return;
  }

  const assets = await scanDirectoryForAssets(scanDir, '/assets/playground');
  await fs.writeJson(outputPath, { assets }, { spaces: 2 });
  if (assets.length > 0) {
    Logger.info(`Discovered ${assets.length} playground asset(s)`);
  }
};

/**
 * Persists the client config to a JSON file.
 */
export const persistClientConfig = async (handoff: Handoff) => {
  const appPath = getAppPath(handoff);
  const destination = path.resolve(appPath, 'client.config.json');
  // Ensure directory exists
  await fs.ensureDir(appPath);
  await fs.writeJson(destination, { config: getClientConfig(handoff.config) }, { spaces: 2 });
};
