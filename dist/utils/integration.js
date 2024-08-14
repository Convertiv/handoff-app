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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeOptions = void 0;
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
var mergeOptions = function (integration) {
    var _a;
    var options = (_a = integration.options) !== null && _a !== void 0 ? _a : {};
    if (!options || !options['*']) {
        return integration;
    }
    var wildcardOptions = options['*'];
    var mergedOptions = {};
    for (var _i = 0, _b = Object.keys(options); _i < _b.length; _i++) {
        var key = _b[_i];
        if (key === '*')
            continue;
        var specificOptions = options[key];
        mergedOptions[key] = {
            cssRootClass: specificOptions.cssRootClass || wildcardOptions.cssRootClass || null,
            tokenNameSegments: specificOptions.tokenNameSegments || wildcardOptions.tokenNameSegments,
            defaults: toLowerCaseKeysAndValues(__assign(__assign({}, wildcardOptions.defaults), specificOptions.defaults)),
            replace: toLowerCaseKeysAndValues(__assign(__assign({}, wildcardOptions.replace), specificOptions.replace)),
        };
    }
    return __assign(__assign({}, integration), { options: mergedOptions });
};
exports.mergeOptions = mergeOptions;
