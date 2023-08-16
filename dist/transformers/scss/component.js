"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentTokensToScssVariables = exports.transformComponentsToScssTypes = void 0;
var utils_1 = require("../utils");
var transformer_1 = require("../transformer");
var utils_2 = require("../../utils");
var transformComponentsToScssTypes = function (name, components, options) {
    var result = {};
    components.forEach(function (component) {
        var componentVariantProps = (0, utils_1.getComponentVariantPropertiesAsMap)(component);
        componentVariantProps.forEach(function (value, variantProp) {
            var _a;
            if (value) {
                (_a = result[variantProp]) !== null && _a !== void 0 ? _a : (result[variantProp] = new Set());
                result[variantProp].add(component.type === 'design'
                    ? (0, utils_1.normalizeTokenNamePartValue)(variantProp, value, options, true)
                    : (0, utils_1.normalizeTokenNamePartValue)(variantProp, value, options, true));
            }
        });
    });
    return Object.keys(result).map(function (variantProp) {
        var mapValsStr = Array.from(result[variantProp]).map(function (val) { return "\"".concat(val, "\""); }).join(', ');
        return "$".concat(name, "-").concat((0, utils_2.slugify)(variantProp), "-map: ( ").concat(mapValsStr, " );");
    }).join('\n\n') + '\n';
};
exports.transformComponentsToScssTypes = transformComponentsToScssTypes;
var transformComponentTokensToScssVariables = function (component, options) {
    return (0, transformer_1.transform)('scss', component, options);
};
exports.transformComponentTokensToScssVariables = transformComponentTokensToScssVariables;
