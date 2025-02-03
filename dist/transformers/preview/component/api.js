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
exports.writeComponentMetadataApi = exports.writeComponentApi = exports.getAPIPath = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
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
    yield fs_extra_1.default.writeFile(path_1.default.resolve((0, exports.getAPIPath)(handoff), 'components.json'), JSON.stringify(componentData, null, 2));
});
const writeComponentApi = (id, component, version, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const outputPath = path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', id);
    if (!fs_extra_1.default.existsSync(outputPath)) {
        fs_extra_1.default.mkdirSync(outputPath, { recursive: true });
    }
    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, `${version}.json`), JSON.stringify(component, null, 2));
});
exports.writeComponentApi = writeComponentApi;
const writeComponentMetadataApi = (id, summary, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    yield fs_extra_1.default.writeFile(path_1.default.resolve((0, exports.getAPIPath)(handoff), 'component', `${id}.json`), JSON.stringify(summary, null, 2));
});
exports.writeComponentMetadataApi = writeComponentMetadataApi;
exports.default = writeComponentSummaryAPI;
