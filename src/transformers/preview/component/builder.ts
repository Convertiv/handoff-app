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
import { readComponentApi, readComponentMetadataApi, updateComponentSummaryApi, writeComponentApi } from './api';
import buildComponentCss from './css';
import buildPreviews from './html';
import buildComponentJs from './javascript';

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
  previews: {},
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
  const componentFileStatesMap: Map<string, Awaited<ReturnType<typeof computeComponentFileStates>>> = new Map();

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
        const currentFileStates = await computeComponentFileStates(handoff, componentId);
        componentFileStatesMap.set(componentId, currentFileStates);

        const cachedEntry = cache?.components?.[componentId];

        if (!cachedEntry) {
          Logger.info(`Component '${componentId}': new component, will build`);
          componentsToBuild.add(componentId);
        } else if (hasComponentChanged(cachedEntry, currentFileStates)) {
          Logger.info(`Component '${componentId}': source files changed, will rebuild`);
          componentsToBuild.add(componentId);
        } else if (!(await checkOutputExists(handoff, componentId))) {
          Logger.info(`Component '${componentId}': output missing, will rebuild`);
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

    // Select the current component metadata from the runtime config.
    // Separate out `type` to enforce/rewrite it during build.
    const runtimeComponent = runtimeComponents[runtimeComponentId];
    const { type, ...restMetadata } = runtimeComponent;

    // Attempt to load any existing persisted component output (previous build).
    // This is used for incremental/partial rebuilds to retain previously generated segments when not rebuilding all.
    const existingData = await readComponentApi(handoff, runtimeComponentId);

    // Compose the base in-memory data for building this component:
    // - Start from a deep clone of the defaultComponent (to avoid mutation bugs)
    // - Merge in metadata from the current runtime configuration (from config/docs)
    // - Explicitly set `type` (defaults to Element if not provided)

    const componentDefaults = cloneDeep(defaultComponent);

    // If this is NOT a figma component, add the default generic preview.
    // We add it here (before merge) so that if the user explicitly provided previews in 'restMetadata',
    // those will override this default (standard "config overrides defaults" behavior).
    if (!restMetadata.figmaComponentId) {
      componentDefaults.previews = {
        generic: {
          title: 'Default',
          values: {},
          url: '',
        },
      };
    }

    let data: TransformComponentTokensResult = {
      ...componentDefaults,
      ...restMetadata,
      type: (type as ComponentType) || ComponentType.Element,
    };

    // buildPlan captures which segments need work for this run.
    const buildPlan = createComponentBuildPlan(segmentToProcess, existingData);

    /**
     * Merge segment data from existing component if this segment is *not* being rebuilt.
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
    if (!buildPlan.validationMode) {
      data.properties = ensureIds(data.properties);
    }

    // Write the updated component data to the API file for external access and caching.
    await writeComponentApi(runtimeComponentId, data, handoff, []);

    // Build the summary metadata for this component.
    const summary = buildComponentSummary(runtimeComponentId, data);
    // Add to the cumulative results, to later update the global components summary file.
    result.push(summary);

    // Update cache entry for this component after successful build
    if (shouldUseCache) {
      if (!cache) {
        cache = createEmptyCache();
      }
      const fileStates = componentFileStatesMap.get(runtimeComponentId);
      if (fileStates) {
        updateComponentCacheEntry(cache, runtimeComponentId, fileStates);
      } else {
        // Compute file states if not already computed (e.g., when global deps changed)
        const computedFileStates = await computeComponentFileStates(handoff, runtimeComponentId);
        updateComponentCacheEntry(cache, runtimeComponentId, computedFileStates);
      }
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
 * @param data
 * @returns
 */
const buildComponentSummary = (id: string, data: TransformComponentTokensResult): ComponentListObject => {
  return {
    id,
    title: data.title,
    description: data.description,
    type: data.type,
    group: data.group,
    image: data.image ? data.image : '',
    figma: data.figma ? data.figma : '',
    categories: data.categories ? data.categories : [],
    tags: data.tags ? data.tags : [],
    properties: data.properties,
    previews: data.previews,
    path: `/api/component/${id}.json`,
  };
};

export default processComponents;
