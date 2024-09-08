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
exports.prepareIntegrationObject = void 0;
var path_1 = __importDefault(require("path"));
var toLowerCaseKeysAndValues = function (obj) {
    var loweredObj = {};
    for (var key in obj) {
        var lowerKey = key.toLowerCase();
        var value = obj[key];
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
var prepareIntegrationObject = function (integration, integrationPath) {
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
    var options = (_a = integration.options) !== null && _a !== void 0 ? _a : {};
    if (!options || !options['*']) {
        return integration;
    }
    var wildcardOptions = options['*'];
    var mergedOptions = {};
    for (var _i = 0, _b = Object.keys(options); _i < _b.length; _i++) {
        var key = _b[_i];
        // if (key === '*') continue;
        var specificOptions = options[key];
        mergedOptions[key] = {
            cssRootClass: specificOptions.cssRootClass || wildcardOptions.cssRootClass || null,
            tokenNameSegments: specificOptions.tokenNameSegments || wildcardOptions.tokenNameSegments || null,
            defaults: toLowerCaseKeysAndValues(__assign(__assign({}, wildcardOptions.defaults), specificOptions.defaults)),
            replace: toLowerCaseKeysAndValues(__assign(__assign({}, wildcardOptions.replace), specificOptions.replace)),
        };
    }
    return __assign(__assign({}, integration), { options: mergedOptions });
};
exports.prepareIntegrationObject = prepareIntegrationObject;
