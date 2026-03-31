import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import processComponents, { ComponentSegment } from '../transformers/preview/component/builder';
import { buildMainCss } from '../transformers/preview/component/css';
import { buildMainJS } from '../transformers/preview/component/javascript';
import { Logger } from '../utils/logger';
import { isPathInside, normalizePathForCompare } from '../utils/path';
import { persistClientConfig } from './client-config';
import { getStrategy, runAllFinalizers, type FinalizeContext } from './config-diff';
import { syncPublicFiles } from './paths';
import {
  getRuntimeComponentsPathsToWatch,
  mapEntryTypeToSegment,
  resolveComponentIdForChangedFile,
  RuntimeComponentEntryType,
} from './watchers/component';
import { scheduleHandler, WatcherState } from './watchers/utils';

export { getRuntimeComponentsPathsToWatch, mapEntryTypeToSegment } from './watchers/component';
export type { WatcherState } from './watchers/utils';

/**
 * Watches the working public directory for changes and updates the app.
 */
export const watchPublicDirectory = (handoff: Handoff, wss: (msg: string) => void, state: WatcherState, chokidarConfig: chokidar.WatchOptions) => {
  if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          await scheduleHandler(state, 'publicDirectory', async () => {
            try {
              Logger.warn('Public directory changed. Handoff will ingest the new data...');
              await syncPublicFiles(handoff);
              wss(JSON.stringify({ type: 'reload' }));
            } catch (e) {
              Logger.error('Error syncing public directory:', e);
            }
          });
          break;
      }
    });
  }
};

/**
 * Watches the application source code for changes.
 */
export const watchAppSource = (handoff: Handoff, initializeProjectApp: (handoff: Handoff) => Promise<string>) => {
  chokidar
    .watch(path.resolve(handoff.modulePath, 'src', 'app'), {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })
    .on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          try {
            await initializeProjectApp(handoff);
          } catch (e) {
            Logger.error('Error initializing project app:', e);
          }
          break;
      }
    });
};

/**
 * Watches the user's pages directory for changes.
 */
export const watchPages = (handoff: Handoff, chokidarConfig: chokidar.WatchOptions) => {
  if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
    chokidar.watch(path.resolve(handoff.workingPath, 'pages'), chokidarConfig).on('all', async (event, path) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          try {
            Logger.warn(`Doc page ${event}ed. Please reload browser to see changes...`);
            Logger.debug(`Path: ${path}`);
          } catch (e) {
            Logger.error('Error watching pages:', e);
          }
          break;
      }
    });
  }
};

/**
 * Watches global SCSS and JS entry points for changes.
 * Rebuilds the main bundles and all components when a global entry changes,
 * since per-component builds may depend on these shared entries.
 */
export const watchGlobalEntries = (handoff: Handoff, state: WatcherState, chokidarConfig: chokidar.WatchOptions) => {
  const scssEntry = handoff.runtimeConfig?.entries?.scss;
  const jsEntry = handoff.runtimeConfig?.entries?.js;

  const scssPathsToWatch: string[] = [];
  const jsPathsToWatch: string[] = [];

  if (scssEntry && fs.existsSync(scssEntry)) {
    const stat = fs.statSync(scssEntry);
    scssPathsToWatch.push(stat.isDirectory() ? scssEntry : path.dirname(scssEntry));
  }

  if (jsEntry && fs.existsSync(jsEntry)) {
    jsPathsToWatch.push(path.dirname(jsEntry));
  }

  const pathsToWatch = [...scssPathsToWatch, ...jsPathsToWatch];
  if (pathsToWatch.length === 0) return;

  chokidar.watch(pathsToWatch, chokidarConfig).on('all', async (event, file) => {
    switch (event) {
      case 'add':
      case 'change':
      case 'unlink':
        await scheduleHandler(state, 'globalEntries', async () => {
          try {
            Logger.warn('Global entry changed. Rebuilding bundles and components...');

            const shouldRebuildMainCss = !!scssEntry && scssPathsToWatch.some((watchPath) => isPathInside(file, watchPath));
            const shouldRebuildMainJs = !!jsEntry && jsPathsToWatch.some((watchPath) => isPathInside(file, watchPath));

            if (shouldRebuildMainCss) {
              await buildMainCss(handoff);
            }

            if (shouldRebuildMainJs) {
              await buildMainJS(handoff);
            }

            await processComponents(handoff);
            await runAllFinalizers(handoff);
          } catch (e) {
            Logger.error('Error rebuilding after global entry change:', e);
          }
        });
        break;
    }
  });
};

/**
 * Watches runtime components for changes.
 */
export const watchRuntimeComponents = (
  handoff: Handoff,
  state: WatcherState,
  runtimeComponentPathsToWatch: Map<string, RuntimeComponentEntryType>
) => {
  if (state.runtimeComponentsWatcher) {
    state.runtimeComponentsWatcher.close();
  }

  if (runtimeComponentPathsToWatch.size > 0) {
    const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
    const runtimeComponentEntryTypeByPath = new Map<string, RuntimeComponentEntryType>(
      Array.from(runtimeComponentPathsToWatch.entries()).map(([watchPath, entryType]) => [normalizePathForCompare(watchPath), entryType])
    );
    const configFileSet = new Set(handoff.getConfigFilePaths().map((configPath) => normalizePathForCompare(configPath)));

    state.runtimeComponentsWatcher = chokidar.watch(pathsToWatch, {
      ignoreInitial: true,
    });
    state.runtimeComponentsWatcher.on('all', async (event, file) => {
      const normalizedFile = normalizePathForCompare(file);
      if (configFileSet.has(normalizedFile)) {
        return;
      }

      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          await scheduleHandler(state, `runtimeComponent:${normalizedFile}`, async () => {
            try {
              const entryType = runtimeComponentEntryTypeByPath.get(normalizedFile);
              const segmentToUpdate: ComponentSegment | undefined = entryType ? mapEntryTypeToSegment(entryType) : undefined;
              const componentId = resolveComponentIdForChangedFile(handoff, file);

              const skipPatterns =
                segmentToUpdate === ComponentSegment.JavaScript ||
                segmentToUpdate === ComponentSegment.Style;

              let finalizeContext: FinalizeContext | undefined;
              if (skipPatterns) {
                finalizeContext = { skipPatternFinalizer: true };
              } else if (componentId) {
                finalizeContext = { patternRebuildComponentIds: [componentId] };
              }

              await processComponents(handoff, componentId, segmentToUpdate);
              await runAllFinalizers(handoff, finalizeContext);
            } catch (e) {
              Logger.error('Error processing component:', e);
            }
          });
          break;
      }
    });
  }
};

/**
 * Watches the runtime configuration for changes.
 *
 * Uses the generic {@link ConfigDiffStrategy} registry so that each entity
 * kind (patterns today, potentially themes / slots later) supplies its own
 * snapshot → diff → selective-rebuild logic without the watcher needing to
 * know the details.
 */
export const watchRuntimeConfiguration = (handoff: Handoff, state: WatcherState) => {
  if (state.runtimeConfigurationWatcher) {
    state.runtimeConfigurationWatcher.close();
  }

  if (handoff.getConfigFilePaths().length > 0) {
    state.runtimeConfigurationWatcher = chokidar.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
    state.runtimeConfigurationWatcher.on('all', async (event, file) => {
      const normalizedFile = normalizePathForCompare(file);
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          await scheduleHandler(state, `runtimeConfig:${normalizedFile}`, async () => {
            try {
              const changedFile = file;

              // Look up the entity this config file belongs to BEFORE reload.
              const entryBefore = handoff.getConfigFileEntry(changedFile);
              const strategy = entryBefore ? getStrategy(entryBefore.kind) : undefined;
              const handle =
                entryBefore && strategy ? strategy.capture(handoff, entryBefore.entityId) : undefined;

              handoff.reload();
              await persistClientConfig(handoff);
              watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
              watchRuntimeConfiguration(handoff, state);

              const entryAfter = handoff.getConfigFileEntry(changedFile);

              const normalizedChanged = normalizePathForCompare(changedFile);
              const normalizedMainConfig = handoff.getMainConfigFilePath()
                ? normalizePathForCompare(handoff.getMainConfigFilePath() as string)
                : undefined;

              if (normalizedMainConfig && normalizedChanged === normalizedMainConfig) {
                await processComponents(handoff);
              } else if (handle) {
                await handle.apply(handoff, entryAfter?.entityId);
              } else {
                const effectiveId = entryAfter?.entityId ?? path.basename(path.dirname(changedFile));
                await processComponents(handoff, effectiveId);
              }

              await runAllFinalizers(handoff);
            } catch (e) {
              Logger.error('Error reloading runtime configuration:', e);
            }
          });
          break;
      }
    });
  }
};

/**
 * Watches the parent component directories from config.entries.components
 * for new components being added. When a new config file (e.g. button.json)
 * appears in a new subdirectory, reloads the runtime config and restarts
 * the component/configuration watchers so the new component is picked up.
 */
export const watchComponentDirectories = (handoff: Handoff, state: WatcherState, chokidarConfig: chokidar.WatchOptions) => {
  if (state.componentDirectoriesWatcher) {
    state.componentDirectoriesWatcher.close();
  }

  const componentPaths = handoff.config.entries?.components ?? [];
  if (componentPaths.length === 0) return;

  const dirsToWatch: string[] = [];
  for (const componentPath of componentPaths) {
    const resolved = path.resolve(handoff.workingPath, componentPath);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      dirsToWatch.push(resolved);
    }
  }

  if (dirsToWatch.length === 0) return;

  const knownComponents = new Set(Object.keys(handoff.runtimeConfig?.entries?.components ?? {}));

  state.componentDirectoriesWatcher = chokidar.watch(dirsToWatch, {
    ...chokidarConfig,
    depth: 1,
  });

  state.componentDirectoriesWatcher.on('add', async (file) => {
    const basename = path.basename(file);
    const dirName = path.basename(path.dirname(file));

    const isConfigFile = basename.endsWith('.json') || basename.endsWith('.js') || basename.endsWith('.cjs');
    const isNewComponent = isConfigFile && basename.startsWith(dirName) && !knownComponents.has(dirName);

    if (!isNewComponent) return;

    await scheduleHandler(state, `newComponent:${dirName}`, async () => {
      try {
        Logger.warn(`New component detected: ${dirName}. Reloading configuration...`);
        handoff.reload();
        knownComponents.add(dirName);

        for (const id of Object.keys(handoff.runtimeConfig?.entries?.components ?? {})) {
          knownComponents.add(id);
        }

        await persistClientConfig(handoff);
        watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
        watchRuntimeConfiguration(handoff, state);
        await processComponents(handoff, dirName);
        await runAllFinalizers(handoff, { patternRebuildComponentIds: [dirName] });
      } catch (e) {
        Logger.error('Error processing new component:', e);
      }
    });
  });
};
