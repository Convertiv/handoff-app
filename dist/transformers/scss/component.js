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
exports.transformComponentTokensToScssVariables = exports.transformComponentsToScssTypes = void 0;
var utils_1 = require("../css/utils");
var tokenSetTransformers_1 = require("../tokenSetTransformers");
var utils_2 = require("../utils");
var transformComponentsToScssTypes = function (name, components, options) {
    var lines = [];
    var themes = (0, utils_1.getThemesFromComponents)(components);
    var types = (0, utils_1.getTypesFromComponents)(components);
    var states = (0, utils_1.getStatesFromComponents)(components);
    var sizes = (0, utils_1.getSizesFromComponents)(components);
    // Types
    if (types && types.length > 0) {
        lines.push("$".concat(name, "-variants: ( ").concat(types.map(function (type) { return "\"".concat(type, "\""); }).join(', '), ");"));
    }
    // Sizes
    if (sizes && sizes.length > 0) {
        lines.push("$".concat(name, "-sizes: ( ").concat(sizes.map(function (type) { return "\"".concat((0, utils_2.normalizeVariableToken)('size', type, options), "\""); }).join(', '), " );"));
    }
    // Themes
    if (themes && themes.length > 0) {
        lines.push("$".concat(name, "-themes: ( ").concat(themes.map(function (type) { return "\"".concat(type, "\""); }).join(', '), " );"));
    }
    // States
    if (states && states.length > 0) {
        lines.push("$".concat(name, "-states: ( ").concat(states.map(function (type) { return "\"".concat(type == 'default' ? '' : type, "\""); }).join(', '), " );"));
    }
    return lines.join('\n\n') + '\n';
};
exports.transformComponentsToScssTypes = transformComponentsToScssTypes;
var transformComponentTokensToScssVariables = function (component, options) {
    var result = {};
    for (var part in component.parts) {
        var tokenSets = component.parts[part];
        if (!tokenSets || tokenSets.length === 0) {
            continue;
        }
        for (var _i = 0, tokenSets_1 = tokenSets; _i < tokenSets_1.length; _i++) {
            var tokenSet = tokenSets_1[_i];
            var transformer = (0, tokenSetTransformers_1.getTokenSetTransformer)(tokenSet);
            if (!transformer) {
                continue;
            }
            result = __assign(__assign({}, result), transformer('scss', component, part, tokenSet, options));
        }
    }
    return result;
};
exports.transformComponentTokensToScssVariables = transformComponentTokensToScssVariables;
