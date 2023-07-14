"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentTokensToScssVariables = exports.transformComponentsToScssTypes = void 0;
var utils_1 = require("../utils");
var transformer_1 = require("../transformer");
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
        lines.push("$".concat(name, "-sizes: ( ").concat(sizes.map(function (type) { return "\"".concat((0, utils_1.normalizeTokenNameVariableValue)('size', type, options), "\""); }).join(', '), " );"));
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
    return (0, transformer_1.transform)('scss', component, options);
};
exports.transformComponentTokensToScssVariables = transformComponentTokensToScssVariables;
