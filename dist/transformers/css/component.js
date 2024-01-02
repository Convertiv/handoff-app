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
var transformComponentsToCssVariables = function (componentId, component) {
    var _a, _b;
    var lines = [];
    var options = (_a = Object.values(component.definitions)[0]) === null || _a === void 0 ? void 0 : _a.options;
    var componentCssClass = (_b = options === null || options === void 0 ? void 0 : options.transformer.cssRootClass) !== null && _b !== void 0 ? _b : componentId;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = component.instances.map(function (instance) {
        return "\t".concat((0, utils_1.formatComponentCodeBlockComment)(instance, '/**/'), "\n").concat((0, exports.transformComponentTokensToCssVariables)(instance, component.definitions[instance.definitionId].options)
            .map(function (token) { return "\t".concat(token.name, ": ").concat(token.value, ";"); })
            .join('\n'));
    });
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
