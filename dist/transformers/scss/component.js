"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentTokensToScssVariables = exports.transformComponentsToScssTypes = void 0;
const utils_1 = require("../utils");
const transformer_1 = require("../transformer");
const utils_2 = require("../../utils");
const transformComponentsToScssTypes = (name, component, options) => {
    const result = {};
    component.instances.forEach((instance) => {
        instance.variantProperties.forEach(([variantProp, value]) => {
            var _a;
            if (value) {
                (_a = result[variantProp]) !== null && _a !== void 0 ? _a : (result[variantProp] = new Set());
                result[variantProp].add((0, utils_1.normalizeTokenNamePartValue)(variantProp, value, options, true));
            }
        });
    });
    return (Object.keys(result)
        .map((variantProp) => {
        const mapValsStr = Array.from(result[variantProp])
            .map((val) => `"${val}"`)
            .join(', ');
        return `$${name}-${(0, utils_2.slugify)(variantProp)}-map: ( ${mapValsStr} );`;
    })
        .join('\n\n') + '\n');
};
exports.transformComponentsToScssTypes = transformComponentsToScssTypes;
const transformComponentTokensToScssVariables = (component, options) => {
    return (0, transformer_1.transform)('scss', component, options);
};
exports.transformComponentTokensToScssVariables = transformComponentTokensToScssVariables;
