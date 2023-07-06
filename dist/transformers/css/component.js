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
var transformComponentsToCssVariables = function (componentName, components, options) {
    var _a;
    var lines = [];
    var componentCssClass = (_a = options === null || options === void 0 ? void 0 : options.rootCssClass) !== null && _a !== void 0 ? _a : componentName;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = components.map(function (component) { return "\t".concat((0, utils_1.formatComponentCodeBlockComment)(componentName, component, '/**/'), "\n").concat(Object.entries((0, exports.transformComponentTokensToCssVariables)(component, options))
        .map(function (_a) {
        var variable = _a[0], value = _a[1];
        return "\t".concat(variable, ": ").concat(value.value, ";");
    })
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
