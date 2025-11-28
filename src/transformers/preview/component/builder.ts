import { Types as CoreTypes } from 'handoff-core';
import cloneDeep from 'lodash/cloneDeep';
import {
  BuildCache,
  checkOutputExists,
  computeComponentFileStates,
  computeGlobalDepsState,
  createEmptyCache,
  hasComponentChanged,
  haveGlobalDepsChanged,
  loadBuildCache,
  pruneRemovedComponents,
  saveBuildCache,
  updateComponentCacheEntry,
} from '../../../cache';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { ensureIds } from '../../utils/schema';
import { ComponentListObject, ComponentType, TransformComponentTokensResult } from '../types';
import { readComponentApi, readComponentMetadataApi, updateComponentSummaryApi, writeComponentApi, writeComponentMetadataApi } from './api';
import buildComponentCss from './css';
import buildPreviews from './html';
import buildComponentJs from './javascript';
import { getLatestVersionForComponent } from './versions';

const defaultComponent: TransformComponentTokensResult = {
  id: '',
  title: 'Untitled',
  figma: '',
  image: '',
  description: 'No description provided',
  preview: 'No preview available',
  type: ComponentType.Element,
  group: 'default',
  should_do: [],
  should_not_do: [],
  categories: [],
  tags: [],
  previews: {
    generic: {
      title: 'Default',
      values: {},
      url: '',
    },
  },
  properties: {},
  code: '',
  html: '',
  format: 'html',
  js: null,
  css: null,
  sass: null,
};

/**
 * Types of component segments that can be updated
 */
export enum ComponentSegment {
  JavaScript = 'javascript',
  Style = 'style',
  Previews = 'previews',
  Validation = 'validation',
}

type ComponentBuildPlan = {
  js: boolean;
  css: boolean;
  previews: boolean;
  validationMode: boolean;
};

/**
 * Returns a normalized build plan describing which component segments need rebuilding.
 *
 * The plan consolidates the conditional logic for:
 *  - Full builds (no segment specified) where every segment should be regenerated
 *  - Targeted rebuilds where only the requested segment runs
 *  - Validation sweeps that only rebuild segments with missing artifacts
 *
 * @param segmentToProcess Optional segment identifier coming from the caller
 * @param existingData Previously persisted component output (if any)
 */
const createComponentBuildPlan = (
  segmentToProcess?: ComponentSegment,
  existingData?: TransformComponentTokensResult
): ComponentBuildPlan => {
  const isValidationMode = segmentToProcess === ComponentSegment.Validation;
  const isFullBuild = !segmentToProcess;

  const previewsMissing = !existingData?.code || Object.values(existingData?.previews || {}).some((preview) => !preview?.url);

  return {
    js: isFullBuild || segmentToProcess === ComponentSegment.JavaScript || (isValidationMode && !existingData?.js),
    css: isFullBuild || segmentToProcess === ComponentSegment.Style || (isValidationMode && !existingData?.css),
    previews: isFullBuild || segmentToProcess === ComponentSegment.Previews || (isValidationMode && previewsMissing),
    validationMode: isValidationMode,
  };
};

/**
 * Options for processing components
 */
export interface ProcessComponentsOptions {
  /** Enable caching to skip unchanged components */
  useCache?: boolean;
}

/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @param options - Optional processing options including cache settings
 * @returns Promise resolving to an array of processed components
 */
export async function processComponents(
  handoff: Handoff,
  id?: string,
  segmentToProcess?: ComponentSegment,
  options?: ProcessComponentsOptions
): Promise<ComponentListObject[]> {
  const result: ComponentListObject[] = [];

  const documentationObject = await handoff.getDocumentationObject();
  const components = documentationObject?.components ?? ({} as CoreTypes.IDocumentationObject['components']);
  const sharedStyles = await handoff.getSharedStyles();
  const runtimeComponents = handoff.runtimeConfig?.entries?.components ?? {};
  const allComponentIds = Object.keys(runtimeComponents);

  // Determine which components need building based on cache (when enabled)
  let componentsToBuild: Set<string>;
  let cache: BuildCache | null = null;
  let currentGlobalDeps = {};
  const componentFileStatesMap: Map<string, Map<string, Awaited<ReturnType<typeof computeComponentFileStates>>>> = new Map();

  // Only use caching when:
  // - useCache option is enabled
  // - No specific component ID is requested (full build scenario)
  // - No specific segment is requested (full build scenario)
  // - Force flag is not set
  const shouldUseCache = options?.useCache && !id && !segmentToProcess && !handoff.force;

  if (shouldUseCache) {
    Logger.debug('Loading build cache...');
    cache = await loadBuildCache(handoff);
    currentGlobalDeps = await computeGlobalDepsState(handoff);
    const globalDepsChanged = haveGlobalDepsChanged(cache?.globalDeps, currentGlobalDeps);

    if (globalDepsChanged) {
      Logger.info('Global dependencies changed, rebuilding all components');
      componentsToBuild = new Set(allComponentIds);
    } else {
      Logger.debug('Global dependencies unchanged');
      componentsToBuild = new Set();

      // Evaluate each component independently
      for (const componentId of allComponentIds) {
        const versions = Object.keys(runtimeComponents[componentId]);
        let needsBuild = false;

        // Store file states for later cache update
        const versionStatesMap = new Map<string, Awaited<ReturnType<typeof computeComponentFileStates>>>();
        componentFileStatesMap.set(componentId, versionStatesMap);

        for (const version of versions) {
          const currentFileStates = await computeComponentFileStates(handoff, componentId, version);
          versionStatesMap.set(version, currentFileStates);

          const cachedEntry = cache?.components?.[componentId]?.[version];

          if (!cachedEntry) {
            Logger.info(`Component '${componentId}@${version}': new component, will build`);
            needsBuild = true;
          } else if (hasComponentChanged(cachedEntry, currentFileStates)) {
            Logger.info(`Component '${componentId}@${version}': source files changed, will rebuild`);
            needsBuild = true;
          } else if (!(await checkOutputExists(handoff, componentId, version))) {
            Logger.info(`Component '${componentId}@${version}': output missing, will rebuild`);
            needsBuild = true;
          }
        }

        if (needsBuild) {
          componentsToBuild.add(componentId);
        } else {
          Logger.info(`Component '${componentId}': unchanged, skipping`);
        }
      }
    }

    // Prune removed components from cache
    if (cache) {
      pruneRemovedComponents(cache, allComponentIds);
    }

    const skippedCount = allComponentIds.length - componentsToBuild.size;
    if (skippedCount > 0) {
      Logger.info(`Building ${componentsToBuild.size} of ${allComponentIds.length} components (${skippedCount} unchanged)`);
    } else if (componentsToBuild.size > 0) {
      Logger.info(`Building all ${componentsToBuild.size} components`);
    } else {
      Logger.info('All components up to date, nothing to build');
    }
  } else {
    // No caching - build all requested components
    componentsToBuild = new Set(allComponentIds);
  }

  for (const runtimeComponentId of allComponentIds) {
    // Skip if specific ID requested and doesn't match
    if (!!id && runtimeComponentId !== id) {
      continue;
    }

    // Skip if caching is enabled and this component doesn't need building
    if (shouldUseCache && !componentsToBuild.has(runtimeComponentId)) {
      // Even though we're skipping the build, we need to include this component's
      // existing summary in the result to prevent data loss in components.json
      const existingSummary = await readComponentMetadataApi(handoff, runtimeComponentId);
      if (existingSummary) {
        result.push(existingSummary);
      }
      continue;
    }

    const versions = Object.keys(runtimeComponents[runtimeComponentId]);
    const latest = getLatestVersionForComponent(versions);
    let latestVersion: TransformComponentTokensResult | undefined;

    await Promise.all(
      versions.map(async (version) => {
        // Select the current component metadata from the runtime config for this id/version.
        // Separate out `type` to enforce/rewrite it during build.
        const runtimeComponent = runtimeComponents[runtimeComponentId][version];
        const { type, ...restMetadata } = runtimeComponent;

        // Attempt to load any existing persisted component output (previous build for this id/version).
        // This is used for incremental/partial rebuilds to retain previously generated segments when not rebuilding all.
        const existingData = await readComponentApi(handoff, runtimeComponentId, version);

        // Compose the base in-memory data for building this component:
        // - Start from a deep clone of the defaultComponent (to avoid mutation bugs)
        // - Merge in metadata from the current runtime configuration (from config/docs)
        // - Explicitly set `type` (defaults to Element if not provided)
        let data: TransformComponentTokensResult = {
          ...cloneDeep(defaultComponent),
          ...restMetadata,
          type: (type as ComponentType) || ComponentType.Element,
        };

        // buildPlan captures which segments need work for this run.
        const buildPlan = createComponentBuildPlan(segmentToProcess, existingData);

        /**
         * Merge segment data from existing version if this segment is *not* being rebuilt.
         * This ensures that when only one segment (e.g., Javascript, CSS, Previews) is being updated,
         * other fields retain their previous values. This avoids unnecessary overwrites or data loss
         * when doing segmented or partial builds.
         */
        if (existingData) {
          // If we're not building JS, carry forward the previous JS output.
          if (!buildPlan.js) {
            data.js = existingData.js;
          }
          // If we're not building CSS/Sass, keep the earlier CSS and Sass outputs.
          if (!buildPlan.css) {
            data.css = existingData.css;
            data.sass = existingData.sass;
          }
          // If we're not building previews, preserve pre-existing HTML, code snippet, and previews.
          if (!buildPlan.previews) {
            data.html = existingData.html;
            data.code = existingData.code;
            data.previews = existingData.previews;
          }
          /**
           * Always keep validation results from the previous data,
           * unless this run is specifically doing a validation update.
           * This keeps validations current without unnecessary recomputation or accidental removal.
           */
          if (!buildPlan.validationMode) {
            data.validations = existingData.validations;
          }
        }

        // Build JS if needed (new build, validation missing, or explicit segment request).
        if (buildPlan.js) {
          data = await buildComponentJs(data, handoff);
        }
        // Build CSS if needed.
        if (buildPlan.css) {
          data = await buildComponentCss(data, handoff, sharedStyles);
        }
        // Build previews (HTML, snapshots, etc) if needed.
        if (buildPlan.previews) {
          data = await buildPreviews(data, handoff, components);
        }

        /**
         * Run validation if explicitly requested and a hook is configured.
         * This allows custom logic to assess the validity of the generated component data.
         */
        if (buildPlan.validationMode && handoff.config?.hooks?.validateComponent) {
          const validationResults = await handoff.config.hooks.validateComponent(data);
          data.validations = validationResults;
        }

        // Attach the resolved sharedStyles to the component data for persistence and downstream usage.
        data.sharedStyles = sharedStyles;

        // Ensure that every property within the properties array/object contains an 'id' field.
        // This guarantees unique identification for property entries, which is useful for updates and API consumers.
        data.properties = ensureIds(data.properties);

        // Write the updated component data to the corresponding API file (by component ID and version) for external access and caching.
        await writeComponentApi(runtimeComponentId, data, version, handoff, []);

        // Store the latest version's full data for potential summary writing after all versions are processed.
        if (version === latest) {
          latestVersion = data;
        }
      })
    );

    /**
     * After processing all requested versions for this component:
     *   - If a latestVersion was produced, write a 'latest.json' API file for the component (points to the most recent/primary version).
     *   - Build a summary object for this component and write it to its summary API file.
     *   - Add the summary to the global result list for summary/index construction.
     * If no version could be processed for this component, throw an error.
     */
    if (latestVersion) {
      // Write the 'latest.json' snapshot for quick access to the most up-to-date version.
      await writeComponentApi(runtimeComponentId, latestVersion, 'latest', handoff, []);
      // Build the summary metadata for this component (includes all versions, properties, previews, etc).
      const summary = buildComponentSummary(runtimeComponentId, latestVersion, versions);
      // Store the summary as a per-component JSON file for documentation or API use.
      await writeComponentMetadataApi(runtimeComponentId, summary, handoff);
      // Add to the cumulative results, to later update the global components summary file.
      result.push(summary);

      // Update cache entries for this component after successful build
      if (shouldUseCache) {
        if (!cache) {
          cache = createEmptyCache();
        }
        const versionStatesMap = componentFileStatesMap.get(runtimeComponentId);
        if (versionStatesMap) {
          for (const [version, fileStates] of versionStatesMap) {
            updateComponentCacheEntry(cache, runtimeComponentId, version, fileStates);
          }
        } else {
          // Compute file states if not already computed (e.g., when global deps changed)
          for (const version of versions) {
            const fileStates = await computeComponentFileStates(handoff, runtimeComponentId, version);
            updateComponentCacheEntry(cache, runtimeComponentId, version, fileStates);
          }
        }
      }
    } else {
      // Defensive: Throw a clear error if somehow no version was processed for this component.
      throw new Error(`No latest version found for ${runtimeComponentId}`);
    }
  }

  // Save the updated cache
  if (shouldUseCache && cache) {
    cache.globalDeps = currentGlobalDeps;
    await saveBuildCache(handoff, cache);
  }

  // Always merge and write summary file, even if no components processed
  const isFullRebuild = !id;
  await updateComponentSummaryApi(handoff, result, isFullRebuild);

  return result;
}

/**
 * Build a summary for the component list
 * @param id
 * @param latest
 * @param versions
 * @returns
 */
const buildComponentSummary = (id: string, latest: TransformComponentTokensResult, versions: string[]): ComponentListObject => {
  return {
    id,
    version: versions[0],
    title: latest.title,
    description: latest.description,
    type: latest.type,
    group: latest.group,
    image: latest.image ? latest.image : '',
    figma: latest.figma ? latest.figma : '',
    categories: latest.categories ? latest.categories : [],
    tags: latest.tags ? latest.tags : [],
    properties: latest.properties,
    previews: latest.previews,
    versions,
    paths: versions.map((version) => `/api/component/${id}/${version}.json`),
  };
};

export default processComponents;
