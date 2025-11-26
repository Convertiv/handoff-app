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
exports.readComponentMetadataApi = exports.readComponentApi = exports.updateComponentSummaryApi = exports.writeComponentMetadataApi = exports.writeComponentApi = exports.getAPIPath = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Merges values from a source object into a target object, returning a new object.
 * For each key present in either object:
 *   - If the key is listed in preserveKeys and the source value is undefined, null, or an empty string,
 *     the target's value is preserved.
 *   - Otherwise, the value from the source is used (even if undefined, null, or empty string).
 * This is useful for partial updates where some properties should not be overwritten unless explicitly set.
 *
 * @param target - The original object to merge into
 * @param source - The object containing new values
 * @param preserveKeys - Keys for which the target's value should be preserved if the source value is undefined, null, or empty string
 * @returns A new object with merged values
 */
function updateObject(target, source, preserveKeys = []) {
    // Collect all unique keys from both target and source
    const allKeys = Array.from(new Set([...Object.keys(target), ...Object.keys(source)]));
    return allKeys.reduce((acc, key) => {
        const sourceValue = source[key];
        const targetValue = target[key];
        // Preserve existing values for specified keys when source value is undefined
        if (preserveKeys.includes(key) && (sourceValue === undefined || sourceValue === null || sourceValue === '')) {
            acc[key] = targetValue;
        }
        else {
            acc[key] = sourceValue;
        }
        return acc;
    }, Object.assign({}, target));
}
const getAPIPath = (handoff) => {
    const apiPath = path_1.default.resolve(handoff.workingPath, `public/api`);
    const componentPath = path_1.default.resolve(handoff.workingPath, `public/api/component`);
    // Ensure the public API path exists
    if (!fs_extra_1.default.existsSync(componentPath)) {
        fs_extra_1.default.mkdirSync(componentPath, { recursive: true });
    }
    return apiPath;
};
exports.getAPIPath = getAPIPath;
/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
const writeComponentSummaryAPI = (handoff, componentData) => __awaiter(void 0, void 0, void 0, function* () {
    componentData.sort((a, b) => a.title.localeCompare(b.title));
    yield fs_extra_1.default.writeFile(path_1.default.resolve((0, exports.getAPIPath)(handoff), 'components.json'), JSON.stringify(componentData, null, 2));
});
const writeComponentApi = (id_1, component_1, version_1, handoff_1, ...args_1) => __awaiter(void 0, [id_1, component_1, version_1, handoff_1, ...args_1], void 0, function* (id, component, version, handoff, preserveKeys = []) {
    const outputDirPath = path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', id);
    const outputFilePath = path_1.default.resolve(outputDirPath, `${version}.json`);
    if (fs_extra_1.default.existsSync(outputFilePath)) {
        const existingJson = yield fs_extra_1.default.readFile(outputFilePath, 'utf8');
        if (existingJson) {
            try {
                const existingData = JSON.parse(existingJson);
                // Special case: always allow page to be cleared when undefined
                // This handles the case where page slices are removed
                const finalPreserveKeys = component.page === undefined ? preserveKeys.filter((key) => key !== 'page') : preserveKeys;
                const mergedData = updateObject(existingData, component, finalPreserveKeys);
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputDirPath, `${version}.json`), JSON.stringify(mergedData, null, 2));
                return;
            }
            catch (_) {
                // Unable to parse existing file
            }
        }
    }
    if (!fs_extra_1.default.existsSync(outputDirPath)) {
        fs_extra_1.default.mkdirSync(outputDirPath, { recursive: true });
    }
    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputDirPath, `${version}.json`), JSON.stringify(component, null, 2));
});
exports.writeComponentApi = writeComponentApi;
const writeComponentMetadataApi = (id, summary, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_extra_1.default.writeFile(path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', `${id}.json`), JSON.stringify(summary, null, 2));
});
exports.writeComponentMetadataApi = writeComponentMetadataApi;
/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
const updateComponentSummaryApi = (handoff_1, componentData_1, ...args_1) => __awaiter(void 0, [handoff_1, componentData_1, ...args_1], void 0, function* (handoff, componentData, isFullRebuild = false) {
    if (isFullRebuild) {
        // Full rebuild: replace the entire file
        yield writeComponentSummaryAPI(handoff, componentData);
        return;
    }
    // Partial update: merge with existing data
    const apiPath = path_1.default.resolve(handoff.workingPath, 'public/api/components.json');
    let existingData = [];
    if (fs_extra_1.default.existsSync(apiPath)) {
        try {
            const existing = yield fs_extra_1.default.readFile(apiPath, 'utf8');
            existingData = JSON.parse(existing);
        }
        catch (_a) {
            // Corrupt or missing JSON — treat as empty
            existingData = [];
        }
    }
    // Replace existing entries with same ID
    const incomingIds = new Set(componentData.map((c) => c.id));
    const merged = [...componentData, ...existingData.filter((c) => !incomingIds.has(c.id))];
    // Always write the file (even if merged is empty)
    yield writeComponentSummaryAPI(handoff, merged);
});
exports.updateComponentSummaryApi = updateComponentSummaryApi;
/**
 * Read the component API data for a specific version
 * @param handoff
 * @param id
 * @param version
 * @returns
 */
const readComponentApi = (handoff, id, version) => __awaiter(void 0, void 0, void 0, function* () {
    const outputDirPath = path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', id);
    const outputFilePath = path_1.default.resolve(outputDirPath, `${version}.json`);
    if (fs_extra_1.default.existsSync(outputFilePath)) {
        try {
            const existingJson = yield fs_extra_1.default.readFile(outputFilePath, 'utf8');
            if (existingJson) {
                return JSON.parse(existingJson);
            }
        }
        catch (_) {
            // Unable to parse existing file
        }
    }
    return null;
});
exports.readComponentApi = readComponentApi;
/**
 * Read the component metadata/summary (the {id}.json file)
 * @param handoff
 * @param id
 * @returns The component summary or null if not found
 */
const readComponentMetadataApi = (handoff, id) => __awaiter(void 0, void 0, void 0, function* () {
    const outputFilePath = path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', `${id}.json`);
    if (fs_extra_1.default.existsSync(outputFilePath)) {
        try {
            const existingJson = yield fs_extra_1.default.readFile(outputFilePath, 'utf8');
            if (existingJson) {
                return JSON.parse(existingJson);
            }
        }
        catch (_) {
            // Unable to parse existing file
        }
    }
    return null;
});
exports.readComponentMetadataApi = readComponentMetadataApi;
exports.default = writeComponentSummaryAPI;
