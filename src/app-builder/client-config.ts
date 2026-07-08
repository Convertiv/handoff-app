import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { getClientConfig } from '../config';
import { resolveAssetStorageFromConfig } from '../registry/asset-storage/resolve';
import { resolveApiTokenEnv, resolveDatabaseUrlEnv, resolveRegistryAdapter } from '../registry/db/adapter';
import type { Config, RuntimeMode } from '../types/config';
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
 * Build the server-only runtime config consumed by the docs read API.
 *
 * The browser-facing `client.config.json` carries only the resolved mode; the server additionally
 * needs the registry connection *inputs* (selected adapter + the *name* of the database-URL env
 * var) to back the registry-mode docs read API. These are non-secret — the connection-string value
 * itself is never persisted, only resolved from the env var at request time.
 */
const buildServerRuntimeConfig = (config: Config, modeOverride?: RuntimeMode) => {
  const assetStorage = resolveAssetStorageFromConfig(config);
  return {
    mode: modeOverride ?? config?.runtime?.mode ?? 'workspace',
    registry: {
      adapter: resolveRegistryAdapter(config),
      databaseUrlEnv: resolveDatabaseUrlEnv(config),
      apiTokenEnv: resolveApiTokenEnv(config),
    },
    assetStorage: {
      adapter: assetStorage.adapterKind,
      module: assetStorage.module,
      tokenEnv: assetStorage.tokenEnv,
      maxInlineBytes: assetStorage.maxInlineBytes,
      options: assetStorage.options,
    },
  };
};

/** Options for {@link persistClientConfig}. */
export interface PersistClientConfigOptions {
  /**
   * Force the runtime mode persisted to both `client.config.json` and `runtime.server.json`,
   * irrespective of the source project's `runtime.mode`. The registry build sets this to `registry`
   * so the packaged artifact reports registry mode (badge + DB-backed reads) even when built from a
   * workspace-mode project.
   */
  runtimeModeOverride?: RuntimeMode;
}

/**
 * Persists the app's resolved config to disk: the browser-facing `client.config.json` and the
 * server-only `runtime.server.json` the docs read API resolves the active mode + registry
 * connection inputs from. Both are always written together so they never drift.
 */
export const persistClientConfig = async (handoff: Handoff, options: PersistClientConfigOptions = {}) => {
  const appPath = getAppPath(handoff);
  // Ensure directory exists
  await fs.ensureDir(appPath);

  const clientConfig = getClientConfig(handoff.config);
  if (options.runtimeModeOverride) {
    // A forced registry mode (the registry build target) is never a connected workspace, so the
    // baked client config must report `connected: false` even when packaged from a connected
    // workspace project.
    const connected = options.runtimeModeOverride === 'registry' ? false : clientConfig.runtime.connected;
    clientConfig.runtime = { ...clientConfig.runtime, mode: options.runtimeModeOverride, connected };
  }

  await fs.writeJson(path.resolve(appPath, 'client.config.json'), { config: clientConfig }, { spaces: 2 });
  await fs.writeJson(
    path.resolve(appPath, 'runtime.server.json'),
    buildServerRuntimeConfig(handoff.config, options.runtimeModeOverride),
    { spaces: 2 }
  );
};
