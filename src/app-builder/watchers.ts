import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '..';
import { buildPatterns } from '../pipeline/patterns';
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
 * Shared factory for watching a parent directory for newly created entity
 * subdirectories (components or patterns). Handles the common scaffolding so
 * that callers only describe what differs for their entity kind:
 *
 *  - which config-entry paths to watch
 *  - how to read the current known ids after a reload
 *  - which WatcherState slot to use
 *  - a log label for the entity kind
 *  - the rebuild work to run once the runtime config is fresh
 */
const watchEntityDirectories = (handoff: Handoff, state: WatcherState, chokidarConfig: chokidar.WatchOptions, options: {
  /** Config paths to watch, e.g. handoff.config.entries?.components */
  getConfigPaths: (handoff: Handoff) => string[];
  /** Current known entity ids from runtime config, called again after reload to refresh the set */
  getKnownIds: (handoff: Handoff) => string[];
  /** Read the active FSWatcher from state */
  getWatcher: (state: WatcherState) => chokidar.FSWatcher | null;
  /** Write the active FSWatcher back into state */
  setWatcher: (state: WatcherState, watcher: chokidar.FSWatcher) => void;
  /** Prefix for the scheduleHandler key, e.g. 'newComponent' or 'newPattern' */
  scheduleKeyPrefix: string;
  /** Human-readable label used in log messages, e.g. 'component' or 'pattern' */
  entityLabel: string;
  /**
   * Entity-specific rebuild work, called after reload + persistClientConfig +
   * watcher re-registration. Receives the handoff instance (with fresh runtime
   * config) and the directory name of the new entity.
   */
  onDetected: (handoff: Handoff, dirName: string) => Promise<void>;
}) => {
  const { getConfigPaths, getKnownIds, getWatcher, setWatcher, scheduleKeyPrefix, entityLabel, onDetected } = options;

  const existingWatcher = getWatcher(state);
  if (existingWatcher) {
    existingWatcher.close();
  }

  const configPaths = getConfigPaths(handoff);
  if (configPaths.length === 0) return;

  const dirsToWatch: string[] = [];
  for (const configPath of configPaths) {
    const resolved = path.resolve(handoff.workingPath, configPath);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      dirsToWatch.push(resolved);
    }
  }

  if (dirsToWatch.length === 0) return;

  // Snapshot known ids at watch startup so we only react to genuinely new
  // entities, not to file changes inside already-known directories.
  const knownIds = new Set(getKnownIds(handoff));

  const watcher = chokidar.watch(dirsToWatch, {
    ...chokidarConfig,
    depth: 1,
  });
  setWatcher(state, watcher);

  watcher.on('add', async (file) => {
    const basename = path.basename(file);
    const dirName = path.basename(path.dirname(file));

    // Only react to the primary declaration file for the directory (e.g.
    // button.json, button.js, or button.handoff.ts inside a button/ subdir).
    // The basename.startsWith(dirName) guard below ensures .ts here only
    // ever matches files named after their parent directory, not arbitrary
    // TypeScript source files.
    const isConfigFile = basename.endsWith('.json') || basename.endsWith('.js') || basename.endsWith('.cjs') || basename.endsWith('.ts');
    const isNewEntity = isConfigFile && basename.startsWith(dirName) && !knownIds.has(dirName);

    if (!isNewEntity) return;

    await scheduleHandler(state, `${scheduleKeyPrefix}:${dirName}`, async () => {
      try {
        Logger.warn(`New ${entityLabel} detected: ${dirName}. Reloading configuration...`);

        // Snapshot ids before reload so we can tell whether the new entity
        // was successfully registered afterwards.
        const idsBefore = new Set(getKnownIds(handoff));

        handoff.reload();
        knownIds.add(dirName);

        // Refresh from the post-reload runtime config so any ids that were
        // discovered alongside the new entity are also marked as known.
        const idsAfter = getKnownIds(handoff);
        for (const id of idsAfter) {
          knownIds.add(id);
        }

        await persistClientConfig(handoff);

        // Re-register file watchers so the new config file and any runtime
        // files it introduces are covered going forward. This must happen even
        // when the file failed to parse so that watchRuntimeConfiguration can
        // trigger a retry the moment the file is saved with valid content.
        watchRuntimeComponents(handoff, state, getRuntimeComponentsPathsToWatch(handoff));
        watchRuntimeConfiguration(handoff, state);

        // If no new ids appeared after reload the file was empty or invalid.
        // Skip the build — watchRuntimeConfiguration will fire when it is saved.
        const hasNewIds = idsAfter.some((id) => !idsBefore.has(id));
        if (!hasNewIds) {
          Logger.warn(`${entityLabel} "${dirName}" config is empty or incomplete — build will run automatically once the file is saved.`);
          return;
        }

        await onDetected(handoff, dirName);
      } catch (e) {
        Logger.error(`Error processing new ${entityLabel}:`, e);
      }
    });
  });
};

/**
 * Watches the parent component directories from config.entries.components for
 * new components being added. When a new config file appears in a new
 * subdirectory, reloads the runtime config, restarts the component and
 * configuration watchers, then builds the new component and any patterns that
 * reference it.
 */
export const watchComponentDirectories = (handoff: Handoff, state: WatcherState, chokidarConfig: chokidar.WatchOptions) => {
  watchEntityDirectories(handoff, state, chokidarConfig, {
    getConfigPaths: (h) => h.config.entries?.components ?? [],
    getKnownIds: (h) => Object.keys(h.runtimeConfig?.entries?.components ?? {}),
    getWatcher: (s) => s.componentDirectoriesWatcher,
    setWatcher: (s, w) => { s.componentDirectoriesWatcher = w; },
    scheduleKeyPrefix: 'newComponent',
    entityLabel: 'component',
    onDetected: async (handoff, dirName) => {
      await processComponents(handoff, dirName);
      await runAllFinalizers(handoff, { patternRebuildComponentIds: [dirName] });
    },
  });
};

/**
 * Watches the parent pattern directories from config.entries.patterns for new
 * patterns being added. The rebuild sequence intentionally differs from
 * watchComponentDirectories because the dependency arrow is reversed: a new
 * pattern references existing components, so we rebuild only the preview
 * segment of those components (to produce the __pattern_* HTML files that
 * injectPatternPreviews registered) before composing the pattern itself.
 */
export const watchPatternDirectories = (handoff: Handoff, state: WatcherState, chokidarConfig: chokidar.WatchOptions) => {
  watchEntityDirectories(handoff, state, chokidarConfig, {
    getConfigPaths: (h) => h.config.entries?.patterns ?? [],
    getKnownIds: (h) => Object.keys(h.runtimeConfig?.entries?.patterns ?? {}),
    getWatcher: (s) => s.patternDirectoriesWatcher,
    setWatcher: (s, w) => { s.patternDirectoriesWatcher = w; },
    scheduleKeyPrefix: 'newPattern',
    entityLabel: 'pattern',
    onDetected: async (handoff, dirName) => {
      // Rebuild only the previews segment for each component the new pattern
      // references. Their JS/CSS/structure are unchanged — only the new
      // synthetic preview HTML files need to be generated so that buildPatterns
      // can assemble the pattern from them.
      const newPattern = handoff.runtimeConfig?.entries?.patterns?.[dirName];
      if (newPattern?.components?.length) {
        for (const ref of newPattern.components) {
          await processComponents(handoff, ref.id, ComponentSegment.Previews);
        }
      }

      // Build only the new pattern directly rather than going through
      // runAllFinalizers, which would rebuild all patterns unnecessarily.
      const newPatternId = newPattern?.id ?? dirName;
      await buildPatterns(handoff, { onlyPatternIds: new Set([newPatternId]) });
    },
  });
};
