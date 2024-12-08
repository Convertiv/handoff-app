"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToMap = void 0;
const transformer_1 = require("../transformer");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
const transformComponentsToMap = (_, component, integrationOptions) => {
    const map = {};
    component.instances.forEach((instance) => {
        const tokens = (0, transformer_1.transform)('map', instance, integrationOptions);
        tokens.forEach((token) => {
            map[token.name] = token.value;
        });
    });
    return map;
};
exports.transformComponentsToMap = transformComponentsToMap;
