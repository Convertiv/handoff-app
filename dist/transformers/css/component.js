"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentTokensToCssVariables = exports.transformComponentsToCssVariables = void 0;
var utils_1 = require("../utils");
var transformer_1 = require("../transformer");
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
var transformComponentsToCssVariables = function (componentId, components, options) {
    var _a;
    var lines = [];
    var componentCssClass = (_a = options === null || options === void 0 ? void 0 : options.cssRootClass) !== null && _a !== void 0 ? _a : componentId;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = components.map(function (component) { return "\t".concat((0, utils_1.formatComponentCodeBlockComment)(component, '/**/'), "\n").concat((0, exports.transformComponentTokensToCssVariables)(component, options)
        .map(function (token) { return "\t".concat(token.name, ": ").concat(token.value, ";"); })
        .join('\n')); });
    return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
exports.transformComponentsToCssVariables = transformComponentsToCssVariables;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
var transformComponentTokensToCssVariables = function (component, options) {
    return (0, transformer_1.transform)('css', component, options);
};
exports.transformComponentTokensToCssVariables = transformComponentTokensToCssVariables;
