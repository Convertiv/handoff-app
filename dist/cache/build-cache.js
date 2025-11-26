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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachePath = getCachePath;
exports.loadBuildCache = loadBuildCache;
exports.saveBuildCache = saveBuildCache;
exports.computeGlobalDepsState = computeGlobalDepsState;
exports.haveGlobalDepsChanged = haveGlobalDepsChanged;
exports.getComponentFilePaths = getComponentFilePaths;
exports.computeComponentFileStates = computeComponentFileStates;
exports.hasComponentChanged = hasComponentChanged;
exports.checkOutputExists = checkOutputExists;
exports.createEmptyCache = createEmptyCache;
exports.updateComponentCacheEntry = updateComponentCacheEntry;
exports.pruneRemovedComponents = pruneRemovedComponents;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const file_state_1 = require("./file-state");
/** Current cache format version - bump when structure changes */
const CACHE_VERSION = '1.0.0';
/**
 * Gets the path to the build cache file
 */
function getCachePath(handoff) {
    return path_1.default.resolve(handoff.modulePath, '.handoff', handoff.getProjectId(), '.cache', 'build-cache.json');
}
/**
 * Loads the build cache from disk
 * @returns The cached data or null if cache doesn't exist or is invalid
 */
function loadBuildCache(handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachePath = getCachePath(handoff);
        try {
            if (!(yield fs_extra_1.default.pathExists(cachePath))) {
                logger_1.Logger.debug('No existing build cache found');
                return null;
            }
            const data = yield fs_extra_1.default.readJson(cachePath);
            // Validate cache version
            if (data.version !== CACHE_VERSION) {
                logger_1.Logger.debug(`Build cache version mismatch (${data.version} vs ${CACHE_VERSION}), invalidating`);
                return null;
            }
            return data;
        }
        catch (error) {
            logger_1.Logger.debug('Failed to load build cache, will rebuild all components:', error);
            return null;
        }
    });
}
/**
 * Saves the build cache to disk
 * Uses atomic write (temp file + rename) to prevent corruption
 */
function saveBuildCache(handoff, cache) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachePath = getCachePath(handoff);
        const cacheDir = path_1.default.dirname(cachePath);
        const tempPath = `${cachePath}.tmp`;
        try {
            yield fs_extra_1.default.ensureDir(cacheDir);
            yield fs_extra_1.default.writeJson(tempPath, cache, { spaces: 2 });
            yield fs_extra_1.default.rename(tempPath, cachePath);
            logger_1.Logger.debug('Build cache saved');
        }
        catch (error) {
            logger_1.Logger.debug('Failed to save build cache:', error);
            // Clean up temp file if it exists
            try {
                yield fs_extra_1.default.remove(tempPath);
            }
            catch (_a) {
                // Ignore cleanup errors
            }
        }
    });
}
/**
 * Computes the current state of global dependencies
 */
function computeGlobalDepsState(handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const result = {};
        // tokens.json
        const tokensPath = handoff.getTokensFilePath();
        result.tokens = (_a = (yield (0, file_state_1.computeFileState)(tokensPath))) !== null && _a !== void 0 ? _a : undefined;
        // shared.scss or shared.css
        const sharedScssPath = path_1.default.resolve(handoff.workingPath, 'integration/components/shared.scss');
        const sharedCssPath = path_1.default.resolve(handoff.workingPath, 'integration/components/shared.css');
        const sharedScssState = yield (0, file_state_1.computeFileState)(sharedScssPath);
        const sharedCssState = yield (0, file_state_1.computeFileState)(sharedCssPath);
        result.sharedStyles = (_b = sharedScssState !== null && sharedScssState !== void 0 ? sharedScssState : sharedCssState) !== null && _b !== void 0 ? _b : undefined;
        // Global SCSS entry
        if ((_d = (_c = handoff.runtimeConfig) === null || _c === void 0 ? void 0 : _c.entries) === null || _d === void 0 ? void 0 : _d.scss) {
            result.globalScss = (_e = (yield (0, file_state_1.computeFileState)(handoff.runtimeConfig.entries.scss))) !== null && _e !== void 0 ? _e : undefined;
        }
        // Global JS entry
        if ((_g = (_f = handoff.runtimeConfig) === null || _f === void 0 ? void 0 : _f.entries) === null || _g === void 0 ? void 0 : _g.js) {
            result.globalJs = (_h = (yield (0, file_state_1.computeFileState)(handoff.runtimeConfig.entries.js))) !== null && _h !== void 0 ? _h : undefined;
        }
        return result;
    });
}
/**
 * Checks if global dependencies have changed
 */
function haveGlobalDepsChanged(cached, current) {
    if (!cached)
        return true;
    // Check each global dependency
    if (!(0, file_state_1.statesMatch)(cached.tokens, current.tokens)) {
        logger_1.Logger.debug('Global dependency changed: tokens.json');
        return true;
    }
    if (!(0, file_state_1.statesMatch)(cached.sharedStyles, current.sharedStyles)) {
        logger_1.Logger.debug('Global dependency changed: shared styles');
        return true;
    }
    if (!(0, file_state_1.statesMatch)(cached.globalScss, current.globalScss)) {
        logger_1.Logger.debug('Global dependency changed: global SCSS entry');
        return true;
    }
    if (!(0, file_state_1.statesMatch)(cached.globalJs, current.globalJs)) {
        logger_1.Logger.debug('Global dependency changed: global JS entry');
        return true;
    }
    return false;
}
/**
 * Gets all file paths that should be tracked for a component
 */
function getComponentFilePaths(handoff, componentId, version) {
    var _a, _b, _c, _d;
    const runtimeComponent = (_d = (_c = (_b = (_a = handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.components) === null || _c === void 0 ? void 0 : _c[componentId]) === null || _d === void 0 ? void 0 : _d[version];
    if (!runtimeComponent) {
        return { files: [] };
    }
    const files = [];
    let templateDir;
    // Find the config file path for this component
    const configPaths = handoff.getConfigFilePaths();
    for (const configPath of configPaths) {
        // Check if this config path belongs to this component/version
        if (configPath.includes(componentId) && configPath.includes(version)) {
            files.push(configPath);
            break;
        }
    }
    // Add entry files
    const entries = runtimeComponent.entries;
    if (entries) {
        if (entries.js) {
            files.push(entries.js);
        }
        if (entries.scss) {
            files.push(entries.scss);
        }
        // Handle both 'template' (singular) and 'templates' (plural) entry types
        const templatePath = entries.template || entries.templates;
        if (templatePath) {
            try {
                const stat = fs_extra_1.default.statSync(templatePath);
                if (stat.isDirectory()) {
                    templateDir = templatePath;
                }
                else {
                    files.push(templatePath);
                }
            }
            catch (_e) {
                // File doesn't exist, still add to track
                files.push(templatePath);
            }
        }
    }
    return { files, templateDir };
}
/**
 * Computes current file states for a component
 */
function computeComponentFileStates(handoff, componentId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const { files: filePaths, templateDir } = getComponentFilePaths(handoff, componentId, version);
        const files = {};
        for (const filePath of filePaths) {
            const state = yield (0, file_state_1.computeFileState)(filePath);
            if (state) {
                files[filePath] = state;
            }
        }
        let templateDirFiles;
        if (templateDir) {
            templateDirFiles = yield (0, file_state_1.computeDirectoryState)(templateDir, ['.hbs', '.html']);
        }
        return { files, templateDirFiles };
    });
}
/**
 * Checks if a component needs to be rebuilt based on file states
 */
function hasComponentChanged(cached, current) {
    if (!cached) {
        return true; // No cache entry means new component
    }
    // Check regular files
    const cachedFiles = Object.keys(cached.files);
    const currentFiles = Object.keys(current.files);
    // Check if file count changed
    if (cachedFiles.length !== currentFiles.length) {
        return true;
    }
    // Check if any files were added or removed
    const cachedSet = new Set(cachedFiles);
    for (const file of currentFiles) {
        if (!cachedSet.has(file)) {
            return true;
        }
    }
    // Check if any file states changed
    for (const file of cachedFiles) {
        if (!(0, file_state_1.statesMatch)(cached.files[file], current.files[file])) {
            return true;
        }
    }
    // Check template directory files if applicable
    if (!(0, file_state_1.directoryStatesMatch)(cached.templateDirFiles, current.templateDirFiles)) {
        return true;
    }
    return false;
}
/**
 * Checks if the component output files exist
 */
function checkOutputExists(handoff, componentId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = path_1.default.resolve(handoff.workingPath, 'public/api/component', componentId, `${version}.json`);
        return fs_extra_1.default.pathExists(outputPath);
    });
}
/**
 * Creates an empty cache structure
 */
function createEmptyCache() {
    return {
        version: CACHE_VERSION,
        globalDeps: {},
        components: {},
    };
}
/**
 * Updates cache entry for a specific component version
 */
function updateComponentCacheEntry(cache, componentId, version, fileStates) {
    if (!cache.components[componentId]) {
        cache.components[componentId] = {};
    }
    cache.components[componentId][version] = {
        files: fileStates.files,
        templateDirFiles: fileStates.templateDirFiles,
        buildTimestamp: Date.now(),
    };
}
/**
 * Removes components from cache that are no longer in runtime config
 */
function pruneRemovedComponents(cache, currentComponentIds) {
    const currentSet = new Set(currentComponentIds);
    const cachedIds = Object.keys(cache.components);
    for (const cachedId of cachedIds) {
        if (!currentSet.has(cachedId)) {
            logger_1.Logger.debug(`Pruning removed component from cache: ${cachedId}`);
            delete cache.components[cachedId];
        }
    }
}
