"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentSegment = void 0;
exports.processComponents = processComponents;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const cache_1 = require("../../../cache");
const logger_1 = require("../../../utils/logger");
const schema_1 = require("../../utils/schema");
const types_1 = require("../types");
const api_1 = require("./api");
const css_1 = __importDefault(require("./css"));
const html_1 = __importDefault(require("./html"));
const javascript_1 = __importDefault(require("./javascript"));
const versions_1 = require("./versions");
const defaultComponent = {
    id: '',
    title: 'Untitled',
    figma: '',
    image: '',
    description: 'No description provided',
    preview: 'No preview available',
    type: types_1.ComponentType.Element,
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
var ComponentSegment;
(function (ComponentSegment) {
    ComponentSegment["JavaScript"] = "javascript";
    ComponentSegment["Style"] = "style";
    ComponentSegment["Previews"] = "previews";
    ComponentSegment["Validation"] = "validation";
})(ComponentSegment || (exports.ComponentSegment = ComponentSegment = {}));
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
const createComponentBuildPlan = (segmentToProcess, existingData) => {
    const isValidationMode = segmentToProcess === ComponentSegment.Validation;
    const isFullBuild = !segmentToProcess;
    const previewsMissing = !(existingData === null || existingData === void 0 ? void 0 : existingData.code) || Object.values((existingData === null || existingData === void 0 ? void 0 : existingData.previews) || {}).some((preview) => !(preview === null || preview === void 0 ? void 0 : preview.url));
    return {
        js: isFullBuild || segmentToProcess === ComponentSegment.JavaScript || (isValidationMode && !(existingData === null || existingData === void 0 ? void 0 : existingData.js)),
        css: isFullBuild || segmentToProcess === ComponentSegment.Style || (isValidationMode && !(existingData === null || existingData === void 0 ? void 0 : existingData.css)),
        previews: isFullBuild || segmentToProcess === ComponentSegment.Previews || (isValidationMode && previewsMissing),
        validationMode: isValidationMode,
    };
};
/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @param options - Optional processing options including cache settings
 * @returns Promise resolving to an array of processed components
 */
function processComponents(handoff, id, segmentToProcess, options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const result = [];
        const documentationObject = yield handoff.getDocumentationObject();
        const components = (_a = documentationObject === null || documentationObject === void 0 ? void 0 : documentationObject.components) !== null && _a !== void 0 ? _a : {};
        const sharedStyles = yield handoff.getSharedStyles();
        const runtimeComponents = (_d = (_c = (_b = handoff.runtimeConfig) === null || _b === void 0 ? void 0 : _b.entries) === null || _c === void 0 ? void 0 : _c.components) !== null && _d !== void 0 ? _d : {};
        const allComponentIds = Object.keys(runtimeComponents);
        // Determine which components need building based on cache (when enabled)
        let componentsToBuild;
        let cache = null;
        let currentGlobalDeps = {};
        const componentFileStatesMap = new Map();
        // Only use caching when:
        // - useCache option is enabled
        // - No specific component ID is requested (full build scenario)
        // - No specific segment is requested (full build scenario)
        // - Force flag is not set
        const shouldUseCache = (options === null || options === void 0 ? void 0 : options.useCache) && !id && !segmentToProcess && !handoff.force;
        if (shouldUseCache) {
            logger_1.Logger.debug('Loading build cache...');
            cache = yield (0, cache_1.loadBuildCache)(handoff);
            currentGlobalDeps = yield (0, cache_1.computeGlobalDepsState)(handoff);
            const globalDepsChanged = (0, cache_1.haveGlobalDepsChanged)(cache === null || cache === void 0 ? void 0 : cache.globalDeps, currentGlobalDeps);
            if (globalDepsChanged) {
                logger_1.Logger.info('Global dependencies changed, rebuilding all components');
                componentsToBuild = new Set(allComponentIds);
            }
            else {
                logger_1.Logger.debug('Global dependencies unchanged');
                componentsToBuild = new Set();
                // Evaluate each component independently
                for (const componentId of allComponentIds) {
                    const versions = Object.keys(runtimeComponents[componentId]);
                    let needsBuild = false;
                    // Store file states for later cache update
                    const versionStatesMap = new Map();
                    componentFileStatesMap.set(componentId, versionStatesMap);
                    for (const version of versions) {
                        const currentFileStates = yield (0, cache_1.computeComponentFileStates)(handoff, componentId, version);
                        versionStatesMap.set(version, currentFileStates);
                        const cachedEntry = (_f = (_e = cache === null || cache === void 0 ? void 0 : cache.components) === null || _e === void 0 ? void 0 : _e[componentId]) === null || _f === void 0 ? void 0 : _f[version];
                        if (!cachedEntry) {
                            logger_1.Logger.info(`Component '${componentId}@${version}': new component, will build`);
                            needsBuild = true;
                        }
                        else if ((0, cache_1.hasComponentChanged)(cachedEntry, currentFileStates)) {
                            logger_1.Logger.info(`Component '${componentId}@${version}': source files changed, will rebuild`);
                            needsBuild = true;
                        }
                        else if (!(yield (0, cache_1.checkOutputExists)(handoff, componentId, version))) {
                            logger_1.Logger.info(`Component '${componentId}@${version}': output missing, will rebuild`);
                            needsBuild = true;
                        }
                    }
                    if (needsBuild) {
                        componentsToBuild.add(componentId);
                    }
                    else {
                        logger_1.Logger.info(`Component '${componentId}': unchanged, skipping`);
                    }
                }
            }
            // Prune removed components from cache
            if (cache) {
                (0, cache_1.pruneRemovedComponents)(cache, allComponentIds);
            }
            const skippedCount = allComponentIds.length - componentsToBuild.size;
            if (skippedCount > 0) {
                logger_1.Logger.info(`Building ${componentsToBuild.size} of ${allComponentIds.length} components (${skippedCount} unchanged)`);
            }
            else if (componentsToBuild.size > 0) {
                logger_1.Logger.info(`Building all ${componentsToBuild.size} components`);
            }
            else {
                logger_1.Logger.info('All components up to date, nothing to build');
            }
        }
        else {
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
                const existingSummary = yield (0, api_1.readComponentMetadataApi)(handoff, runtimeComponentId);
                if (existingSummary) {
                    result.push(existingSummary);
                }
                continue;
            }
            const versions = Object.keys(runtimeComponents[runtimeComponentId]);
            const latest = (0, versions_1.getLatestVersionForComponent)(versions);
            let latestVersion;
            yield Promise.all(versions.map((version) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                // Select the current component metadata from the runtime config for this id/version.
                // Separate out `type` to enforce/rewrite it during build.
                const runtimeComponent = runtimeComponents[runtimeComponentId][version];
                const { type } = runtimeComponent, restMetadata = __rest(runtimeComponent, ["type"]);
                // Attempt to load any existing persisted component output (previous build for this id/version).
                // This is used for incremental/partial rebuilds to retain previously generated segments when not rebuilding all.
                const existingData = yield (0, api_1.readComponentApi)(handoff, runtimeComponentId, version);
                // Compose the base in-memory data for building this component:
                // - Start from a deep clone of the defaultComponent (to avoid mutation bugs)
                // - Merge in metadata from the current runtime configuration (from config/docs)
                // - Explicitly set `type` (defaults to Element if not provided)
                let data = Object.assign(Object.assign(Object.assign({}, (0, cloneDeep_1.default)(defaultComponent)), restMetadata), { type: type || types_1.ComponentType.Element });
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
                    data = yield (0, javascript_1.default)(data, handoff);
                }
                // Build CSS if needed.
                if (buildPlan.css) {
                    data = yield (0, css_1.default)(data, handoff, sharedStyles);
                }
                // Build previews (HTML, snapshots, etc) if needed.
                if (buildPlan.previews) {
                    data = yield (0, html_1.default)(data, handoff, components);
                }
                /**
                 * Run validation if explicitly requested and a hook is configured.
                 * This allows custom logic to assess the validity of the generated component data.
                 */
                if (buildPlan.validationMode && ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.validateComponent)) {
                    const validationResults = yield handoff.config.hooks.validateComponent(data);
                    data.validations = validationResults;
                }
                // Attach the resolved sharedStyles to the component data for persistence and downstream usage.
                data.sharedStyles = sharedStyles;
                // Ensure that every property within the properties array/object contains an 'id' field.
                // This guarantees unique identification for property entries, which is useful for updates and API consumers.
                data.properties = (0, schema_1.ensureIds)(data.properties);
                // Write the updated component data to the corresponding API file (by component ID and version) for external access and caching.
                yield (0, api_1.writeComponentApi)(runtimeComponentId, data, version, handoff, []);
                // Store the latest version's full data for potential summary writing after all versions are processed.
                if (version === latest) {
                    latestVersion = data;
                }
            })));
            /**
             * After processing all requested versions for this component:
             *   - If a latestVersion was produced, write a 'latest.json' API file for the component (points to the most recent/primary version).
             *   - Build a summary object for this component and write it to its summary API file.
             *   - Add the summary to the global result list for summary/index construction.
             * If no version could be processed for this component, throw an error.
             */
            if (latestVersion) {
                // Write the 'latest.json' snapshot for quick access to the most up-to-date version.
                yield (0, api_1.writeComponentApi)(runtimeComponentId, latestVersion, 'latest', handoff, []);
                // Build the summary metadata for this component (includes all versions, properties, previews, etc).
                const summary = buildComponentSummary(runtimeComponentId, latestVersion, versions);
                // Store the summary as a per-component JSON file for documentation or API use.
                yield (0, api_1.writeComponentMetadataApi)(runtimeComponentId, summary, handoff);
                // Add to the cumulative results, to later update the global components summary file.
                result.push(summary);
                // Update cache entries for this component after successful build
                if (shouldUseCache) {
                    if (!cache) {
                        cache = (0, cache_1.createEmptyCache)();
                    }
                    const versionStatesMap = componentFileStatesMap.get(runtimeComponentId);
                    if (versionStatesMap) {
                        for (const [version, fileStates] of versionStatesMap) {
                            (0, cache_1.updateComponentCacheEntry)(cache, runtimeComponentId, version, fileStates);
                        }
                    }
                    else {
                        // Compute file states if not already computed (e.g., when global deps changed)
                        for (const version of versions) {
                            const fileStates = yield (0, cache_1.computeComponentFileStates)(handoff, runtimeComponentId, version);
                            (0, cache_1.updateComponentCacheEntry)(cache, runtimeComponentId, version, fileStates);
                        }
                    }
                }
            }
            else {
                // Defensive: Throw a clear error if somehow no version was processed for this component.
                throw new Error(`No latest version found for ${runtimeComponentId}`);
            }
        }
        // Save the updated cache
        if (shouldUseCache && cache) {
            cache.globalDeps = currentGlobalDeps;
            yield (0, cache_1.saveBuildCache)(handoff, cache);
        }
        // Always merge and write summary file, even if no components processed
        const isFullRebuild = !id;
        yield (0, api_1.updateComponentSummaryApi)(handoff, result, isFullRebuild);
        return result;
    });
}
/**
 * Build a summary for the component list
 * @param id
 * @param latest
 * @param versions
 * @returns
 */
const buildComponentSummary = (id, latest, versions) => {
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
exports.default = processComponents;
