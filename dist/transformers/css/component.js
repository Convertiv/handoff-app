"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenReferenceFormat = exports.transformComponentTokensToCssVariables = exports.transformComponentsToCssVariables = void 0;
var utils_1 = require("../utils");
var transformer_1 = require("../transformer");
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
var transformComponentsToCssVariables = function (componentId, component, integrationOptions) {
    var _a;
    var lines = [];
    var componentCssClass = (_a = integrationOptions === null || integrationOptions === void 0 ? void 0 : integrationOptions.cssRootClass) !== null && _a !== void 0 ? _a : componentId;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = component.instances.map(function (instance) {
        return "\t".concat((0, utils_1.formatComponentCodeBlockComment)(instance, '/**/'), "\n").concat((0, exports.transformComponentTokensToCssVariables)(instance, integrationOptions)
            .map(function (token) { return "\t".concat(token.name, ": ").concat((0, exports.tokenReferenceFormat)(token, 'css'), ";"); })
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
var tokenReferenceFormat = function (token, type) {
    var reference = token.metadata.reference;
    if (reference) {
        // If the token is a border token, we don't need to add the css property to the reference
        if (['border-width', 'border-radius', 'border-style'].includes(token.metadata.cssProperty)) {
            reference = undefined;
        }
        else if (!['box-shadow', 'background', 'color'].includes(token.metadata.cssProperty)) {
            reference += "-".concat(token.metadata.cssProperty);
        }
    }
    var wrapped = type === 'css' ? "var(--".concat(reference, ")") : "$".concat(reference);
    return reference ? wrapped : token.value;
};
exports.tokenReferenceFormat = tokenReferenceFormat;
