"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestCount = exports.getComponentSetNodes = exports.getComponentSets = exports.getFileStyles = exports.getAssetURL = exports.getFileNodes = exports.getFileComponent = exports.getFile = void 0;
var axios_1 = __importDefault(require("axios"));
var figmaRestApi = axios_1.default.create({
    baseURL: process.env.HANDOFF_FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});
var counter = 0;
var getFile = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId, {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
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
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileComponent = getFileComponent;
var getFileNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileNodes = getFileNodes;
var getAssetURL = function (fileId, ids, extension, accessToken) {
    counter++;
    return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getAssetURL = getAssetURL;
var getFileStyles = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/styles', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getFileStyles = getFileStyles;
var getComponentSets = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/component_sets', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getComponentSets = getComponentSets;
var getComponentSetNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(',') + '&plugin_data=shared', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
exports.getComponentSetNodes = getComponentSetNodes;
var getRequestCount = function () { return counter; };
exports.getRequestCount = getRequestCount;
exports.default = figmaRestApi;
var getFigmaAuthHeaders = function (accessToken) {
    return accessToken.startsWith('Bearer ') ? { 'Authorization': accessToken } : { 'X-Figma-Token': accessToken };
};
