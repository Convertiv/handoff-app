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
exports.updateComponentSummaryApi = exports.writeComponentMetadataApi = exports.writeComponentApi = exports.getAPIPath = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function updateObject(target, source) {
    return Object.entries(source).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
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
const writeComponentApi = (id, component, version, handoff, isPartialUpdate = false) => __awaiter(void 0, void 0, void 0, function* () {
    const outputDirPath = path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', id);
    if (isPartialUpdate) {
        const outputFilePath = path_1.default.resolve(outputDirPath, `${version}.json`);
        if (fs_extra_1.default.existsSync(outputFilePath)) {
            const existingJson = yield fs_extra_1.default.readFile(outputFilePath, 'utf8');
            if (existingJson) {
                const existingData = JSON.parse(existingJson);
                const mergedData = updateObject(existingData, component);
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputDirPath, `${version}.json`), JSON.stringify(mergedData, null, 2));
                return;
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
const updateComponentSummaryApi = (handoff, componentData) => __awaiter(void 0, void 0, void 0, function* () {
    const apiPath = path_1.default.resolve(handoff.workingPath, `public/api/components.json`);
    let newComponentData = [componentData], existingData = [];
    if (fs_extra_1.default.existsSync(apiPath)) {
        const existing = yield fs_extra_1.default.readFile(apiPath, 'utf8');
        if (existing) {
            existingData = JSON.parse(existing);
            existingData = existingData.filter((component) => component.id !== componentData.id);
        }
    }
    yield writeComponentSummaryAPI(handoff, newComponentData.concat(existingData));
});
exports.updateComponentSummaryApi = updateComponentSummaryApi;
exports.default = writeComponentSummaryAPI;
