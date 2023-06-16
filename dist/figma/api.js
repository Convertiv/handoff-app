import axios from 'axios';
var figmaRestApi = axios.create({
    baseURL: process.env.FIGMA_BASE_URL || 'https://api.figma.com/v1/',
});
var counter = 0;
export var getFile = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId, {
        headers: {
            'X-Figma-Token': accessToken,
        },
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
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getFileNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getAssetURL = function (fileId, ids, extension, accessToken) {
    counter++;
    return figmaRestApi.get('images/' + fileId + '/?ids=' + ids.join(',') + '&format=' + extension, {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getFileStyles = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/styles', {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getComponentSets = function (fileId, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/component_sets', {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getComponentSetNodes = function (fileId, ids, accessToken) {
    counter++;
    return figmaRestApi.get('files/' + fileId + '/nodes?ids=' + ids.join(','), {
        headers: {
            'X-Figma-Token': accessToken,
        },
    });
};
export var getRequestCount = function () { return counter; };
export default figmaRestApi;
