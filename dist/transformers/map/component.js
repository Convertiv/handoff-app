"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToMap = void 0;
var transformer_1 = require("../transformer");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToMap = function (_, component) {
    var map = {};
    component.instances.forEach(function (instance) {
        var options = component.definitions[instance.definitionId].options;
        var tokens = (0, transformer_1.transform)('map', instance, options);
        tokens.forEach(function (token) {
            map[token.name] = token.value;
        });
    });
    return map;
};
exports.transformComponentsToMap = transformComponentsToMap;
