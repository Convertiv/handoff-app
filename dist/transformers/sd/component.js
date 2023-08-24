"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToStyleDictionary = void 0;
var transformer_1 = require("../transformer");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToStyleDictionary = function (_, components, options) {
    var sd = {};
    components.forEach(function (component) {
        var tokens = (0, transformer_1.transform)('sd', component, options);
        tokens.forEach(function (token) {
            var tokenNameSegments = token.metadata.nameSegments;
            var lastIdx = tokenNameSegments.length - 1;
            var ref = sd;
            tokenNameSegments.forEach(function (tokenNameSegment, idx) {
                var _a;
                if (idx === lastIdx) {
                    return;
                }
                (_a = ref[tokenNameSegment]) !== null && _a !== void 0 ? _a : (ref[tokenNameSegment] = {});
                ref = ref[tokenNameSegment];
            });
            var propParts = tokenNameSegments[lastIdx].split('-');
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
