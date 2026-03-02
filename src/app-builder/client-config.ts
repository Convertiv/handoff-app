import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { getClientConfig } from '../config';
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
