"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToStyleDictionary = void 0;
var transformer_1 = require("../transformer");
var constants_1 = require("../constants");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToStyleDictionary = function (_, components, options) {
    var sd = {};
    components.forEach(function (component) {
        var tokens = (0, transformer_1.transform)('sd', component, options);
        Object.entries(tokens).forEach(function (_a) {
            var _ = _a[0], token = _a[1];
            var propPath = token.metadata.propertyPath;
            var lastIdx = propPath.length - 1;
            var ref = sd;
            propPath.forEach(function (el, idx) {
                var _a;
                if (idx === lastIdx) {
                    return;
                }
                (_a = ref[el]) !== null && _a !== void 0 ? _a : (ref[el] = {});
                ref = ref[el];
            });
            var propParts = propPath[lastIdx].split(constants_1.tokenNamePartsSeparator);
            propParts.forEach(function (el) {
                var _a;
                (_a = ref[el]) !== null && _a !== void 0 ? _a : (ref[el] = {});
                ref = ref[el];
            });
            ref['value'] = token.value;
        });
    });
    return JSON.stringify(sd, null, 2);
};
exports.transformComponentsToStyleDictionary = transformComponentsToStyleDictionary;
