import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildMainCss } from '../transformers/preview/component/css';
import { buildMainJS } from '../transformers/preview/component/javascript';
import processComponents, { ComponentSegment } from '../transformers/preview/component/builder';
import { ComponentListObject } from '../transformers/preview/types';
import { Logger } from '../utils/logger';
import { isPathInside, normalizePathForCompare } from '../utils/path';
import { persistClientConfig } from './client-config';
import { syncPublicFiles } from './paths';

export interface WatcherState {
  debounce: boolean;
  runtimeComponentsWatcher: chokidar.FSWatcher | null;
  runtimeConfigurationWatcher: chokidar.FSWatcher | null;
}

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
          if (!state.debounce) {
            state.debounce = true;
            try {
              Logger.warn('Public directory changed. Handoff will ingest the new data...');
              await syncPublicFiles(handoff);
              wss(JSON.stringify({ type: 'reload' }));
            } catch (e) {
              Logger.error('Error syncing public directory:', e);
            } finally {
              state.debounce = false;
            }
          }
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
        if (!state.debounce) {
          state.debounce = true;
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
          } catch (e) {
            Logger.error('Error rebuilding after global entry change:', e);
          } finally {
            state.debounce = false;
          }
        }
        break;
    }
  });
};

/**
 * Maps configuration entry types to component segments.
 */
export const mapEntryTypeToSegment = (type: keyof ComponentListObject['entries']): ComponentSegment | undefined => {
  return {
    js: ComponentSegment.JavaScript,
    scss: ComponentSegment.Style,
    template: ComponentSegment.Previews,
    templates: ComponentSegment.Previews,
    component: ComponentSegment.Previews,
    story: ComponentSegment.Previews,
  }[type];
};

const resolveComponentIdForChangedFile = (handoff: Handoff, changedFilePath: string): string | undefined => {
  const normalizedChangedPath = normalizePathForCompare(changedFilePath);
  const runtimeComponents = handoff.runtimeConfig?.entries?.components ?? {};

  for (const [componentId, componentDef] of Object.entries(runtimeComponents)) {
    const entries = componentDef.entries ?? {};
    for (const entryPath of Object.values(entries)) {
      if (!entryPath) continue;
      const normalizedEntryPath = normalizePathForCompare(entryPath as string);
      if (normalizedEntryPath === normalizedChangedPath) {
        return componentId;
      }
    }
  }

  // Fallback for legacy path conventions when exact match is unavailable.
  return path.basename(path.dirname(changedFilePath));
};

/**
 * Gets the paths of runtime components to watch.
 *
 * @returns A Map of paths to watch and their entry types
 */
export const getRuntimeComponentsPathsToWatch = (handoff: Handoff) => {
  const result: Map<string, keyof ComponentListObject['entries']> = new Map();

  for (const runtimeComponentId of Object.keys(handoff.runtimeConfig?.entries.components ?? {})) {
    const runtimeComponent = handoff.runtimeConfig.entries.components[runtimeComponentId];
    for (const [runtimeComponentEntryType, runtimeComponentEntryPath] of Object.entries(runtimeComponent.entries ?? {})) {
      const normalizedComponentEntryPath = runtimeComponentEntryPath as string;
      if (fs.existsSync(normalizedComponentEntryPath)) {
        const entryType = runtimeComponentEntryType as keyof ComponentListObject['entries'];
        if (fs.statSync(normalizedComponentEntryPath).isFile()) {
          result.set(path.resolve(normalizedComponentEntryPath), entryType);
        } else {
          result.set(normalizedComponentEntryPath, entryType);
        }
      }
    }
  }

  return result;
};

/**
 * Watches runtime components for changes.
 */
export const watchRuntimeComponents = (
  handoff: Handoff,
  state: WatcherState,
  runtimeComponentPathsToWatch: Map<string, keyof ComponentListObject['entries']>
) => {
  if (state.runtimeComponentsWatcher) {
    state.runtimeComponentsWatcher.close();
  }

  if (runtimeComponentPathsToWatch.size > 0) {
    const pathsToWatch = Array.from(runtimeComponentPathsToWatch.keys());
    const runtimeComponentEntryTypeByPath = new Map<string, keyof ComponentListObject['entries']>(
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
          if (!state.debounce) {
            state.debounce = true;
            try {
              const entryType = runtimeComponentEntryTypeByPath.get(normalizedFile);
              const segmentToUpdate: ComponentSegment = entryType ? mapEntryTypeToSegment(entryType) : undefined;
              const componentId = resolveComponentIdForChangedFile(handoff, file);
              await processComponents(handoff, componentId, segmentToUpdate);
            } catch (e) {
              Logger.error('Error processing component:', e);
            } finally {
              state.debounce = false;
            }
          }
          break;
      }
    });
  }
};

/**
 * Watches the runtime configuration for changes.
 */
export const watchRuntimeConfiguration = (handoff: Handoff, state: WatcherState) => {
  if (state.runtimeConfigurationWatcher) {
    state.runtimeConfigurationWatcher.close();
  }

  if (handoff.getConfigFilePaths().length > 0) {
    state.runtimeConfigurationWatcher = chokidar.watch(handoff.getConfigFilePaths(), { ignoreInitial: true });
    state.runtimeConfigurationWatcher.on('all', async (event, file) => {
      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!state.debounce) {
            state.debounce = true;
            try {
              const changedFile = file;
              const changedDir = path.dirname(changedFile);
              // Reload the Handoff instance to pick up configuration changes
              handoff.reload();
              // After reloading, persist the updated client configuration
              await persistClientConfig(handoff);
              // Restart the runtime components watcher to track potentially updated/added/removed components
              watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
              // Process components based on the updated configuration and changed file kind
              const normalizedChanged = normalizePathForCompare(changedFile);
              const normalizedMainConfig = handoff.getMainConfigFilePath()
                ? normalizePathForCompare(handoff.getMainConfigFilePath() as string)
                : undefined;

              if (normalizedMainConfig && normalizedChanged === normalizedMainConfig) {
                await processComponents(handoff);
              } else {
                await processComponents(handoff, path.basename(changedDir));
              }
            } catch (e) {
              Logger.error('Error reloading runtime configuration:', e);
            } finally {
              state.debounce = false;
            }
          }
          break;
      }
    });
  }
};
