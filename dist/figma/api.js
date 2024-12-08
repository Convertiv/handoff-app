"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestCount = exports.getComponentSetNodes = exports.getComponentSets = exports.getFileStyles = exports.getAssetURL = exports.getFileNodes = exports.getFileComponent = exports.getFile = void 0;
const axios_1 = __importDefault(require("axios"));
const figmaRestApi = axios_1.default.create({
    baseURL: process.env.HANDOFF_FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});
let counter = 0;
const getFile = (fileId, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId, {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFile = getFile;
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
const getFileComponent = (fileId, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/components', {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileComponent = getFileComponent;
const getFileNodes = (fileId, ids, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileNodes = getFileNodes;
const getAssetURL = (fileId, ids, extension, accessToken) => {
    counter++;
    return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getAssetURL = getAssetURL;
const getFileStyles = (fileId, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/styles', {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileStyles = getFileStyles;
const getComponentSets = (fileId, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/component_sets', {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getComponentSets = getComponentSets;
const getComponentSetNodes = (fileId, ids, accessToken) => {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(',') + '&plugin_data=shared', {
        headers: Object.assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getComponentSetNodes = getComponentSetNodes;
const getRequestCount = () => counter;
exports.getRequestCount = getRequestCount;
exports.default = figmaRestApi;
const getFigmaAuthHeaders = (accessToken) => accessToken.startsWith('Bearer ') ? { 'Authorization': accessToken } : { 'X-Figma-Token': accessToken };
