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
import axios from 'axios';
var figmaRestApi = axios.create({
    baseURL: process.env.HANDOFF_FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});
var counter = 0;
export var getFile = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId, {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
/**
 * Fetch the frontend components
 * @param fileId
 * @param accessToken
 * @returns Promise<FileComponentsResponse>
 */
export var getFileComponent = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/components', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getFileNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getAssetURL = function (fileId, ids, extension, accessToken) {
    counter++;
    return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getFileStyles = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/styles', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getComponentSets = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/component_sets', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getComponentSetNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(',') + '&plugin_data=shared', {
        headers: __assign({}, getFigmaAuthHeaders(accessToken)),
    });
};
export var getRequestCount = function () { return counter; };
export default figmaRestApi;
var getFigmaAuthHeaders = function (accessToken) {
    return accessToken.startsWith('Bearer ') ? { 'Authorization': accessToken } : { 'X-Figma-Token': accessToken };
};
