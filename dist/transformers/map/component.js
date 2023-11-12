"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToMap = void 0;
var transformer_1 = require("../transformer");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToMap = function (_, components, options) {
    var map = {};
    components.forEach(function (component) {
        var tokens = (0, transformer_1.transform)('map', component, options);
        tokens.forEach(function (token) {
            map[token.name] = token.value;
        });
    });
    return JSON.stringify(map, null, 2);
};
exports.transformComponentsToMap = transformComponentsToMap;
