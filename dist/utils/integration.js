"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareIntegrationObject = void 0;
const path_1 = __importDefault(require("path"));
const toLowerCaseKeysAndValues = (obj) => {
    const loweredObj = {};
    for (const key in obj) {
        const lowerKey = key.toLowerCase();
        const value = obj[key];
        if (typeof value === 'string') {
            loweredObj[lowerKey] = value.toLowerCase();
        }
        else if (typeof value === 'object' && value !== null) {
            loweredObj[lowerKey] = toLowerCaseKeysAndValues(value);
        }
        else {
            loweredObj[lowerKey] = value; // For non-string values
        }
    }
    return loweredObj;
};
const prepareIntegrationObject = (integration, integrationPath) => {
    var _a;
    if (integration.entries) {
        if (integration.entries.bundle) {
            integration.entries.bundle = path_1.default.resolve(integrationPath, integration.entries.bundle);
        }
        if (integration.entries.templates) {
            integration.entries.templates = path_1.default.resolve(integrationPath, integration.entries.templates);
        }
        if (integration.entries.integration) {
            integration.entries.integration = path_1.default.resolve(integrationPath, integration.entries.integration);
        }
    }
    const options = (_a = integration.options) !== null && _a !== void 0 ? _a : {};
    if (!options || !options['*']) {
        return integration;
    }
    const wildcardOptions = options['*'];
    const mergedOptions = {};
    for (const key of Object.keys(options)) {
        // if (key === '*') continue;
        const specificOptions = options[key];
        mergedOptions[key] = {
            cssRootClass: specificOptions.cssRootClass || wildcardOptions.cssRootClass || null,
            tokenNameSegments: specificOptions.tokenNameSegments || wildcardOptions.tokenNameSegments || null,
            defaults: toLowerCaseKeysAndValues(Object.assign(Object.assign({}, wildcardOptions.defaults), specificOptions.defaults)),
            replace: toLowerCaseKeysAndValues(Object.assign(Object.assign({}, wildcardOptions.replace), specificOptions.replace)),
        };
    }
    return Object.assign(Object.assign({}, integration), { options: mergedOptions });
};
exports.prepareIntegrationObject = prepareIntegrationObject;
