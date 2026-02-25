import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildMainCss } from '../transformers/preview/component/css';
import { buildMainJS } from '../transformers/preview/component/javascript';
import processComponents, { ComponentSegment } from '../transformers/preview/component/builder';
import { ComponentListObject } from '../transformers/preview/types';
import { Logger } from '../utils/logger';
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

  const isPathInside = (filePath: string, parentPath: string): boolean => {
    const normalizedFilePath = path.resolve(filePath);
    const normalizedParentPath = path.resolve(parentPath);
    return normalizedFilePath === normalizedParentPath || normalizedFilePath.startsWith(`${normalizedParentPath}${path.sep}`);
  };

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
  }[type];
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
    state.runtimeComponentsWatcher = chokidar.watch(pathsToWatch, {
      ignoreInitial: true,
    });
    state.runtimeComponentsWatcher.on('all', async (event, file) => {
      if (handoff.getConfigFilePaths().includes(file)) {
        return;
      }

      switch (event) {
        case 'add':
        case 'change':
        case 'unlink':
          if (!state.debounce) {
            state.debounce = true;
            try {
              const entryType = runtimeComponentPathsToWatch.get(file);
              const segmentToUpdate: ComponentSegment = entryType ? mapEntryTypeToSegment(entryType) : undefined;

              const componentDir = path.basename(path.dirname(file));
              await processComponents(handoff, componentDir, segmentToUpdate);
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
              file = path.dirname(file);
              // Reload the Handoff instance to pick up configuration changes
              handoff.reload();
              // After reloading, persist the updated client configuration
              await persistClientConfig(handoff);
              // Restart the runtime components watcher to track potentially updated/added/removed components
              watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
              // Process components based on the updated configuration and file path
              await processComponents(handoff, path.basename(file));
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
