"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestCount = exports.getComponentSetNodes = exports.getComponentSets = exports.getFileStyles = exports.getAssetURL = exports.getFileNodes = exports.getFileComponent = exports.getFile = void 0;
var axios_1 = __importDefault(require("axios"));
var figmaRestApi = axios_1.default.create({
    baseURL: process.env.FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});
var counter = 0;
var getFile = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId, {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getFile = getFile;
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
var getFileComponent = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/components', {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getFileComponent = getFileComponent;
var getFileNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getFileNodes = getFileNodes;
var getAssetURL = function (fileId, ids, extension, accessToken) {
    counter++;
    return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getAssetURL = getAssetURL;
var getFileStyles = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/styles', {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getFileStyles = getFileStyles;
var getComponentSets = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/component_sets', {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getComponentSets = getComponentSets;
var getComponentSetNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
exports.getComponentSetNodes = getComponentSetNodes;
var getRequestCount = function () { return counter; };
exports.getRequestCount = getRequestCount;
exports.default = figmaRestApi;
