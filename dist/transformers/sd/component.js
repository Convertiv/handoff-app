"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToStyleDictionary = void 0;
var transformer_1 = require("../transformer");
var component_1 = require("../css/component");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
var transformComponentsToStyleDictionary = function (_, component, handoff, integrationOptions) {
    var sd = {};
    component.instances.forEach(function (instance) {
        var tokens = (0, transformer_1.transform)('sd', instance, integrationOptions);
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
            ref['value'] = (0, component_1.tokenReferenceFormat)(token, 'sd', handoff);
        });
    });
    return JSON.stringify(sd, null, 2);
};
exports.transformComponentsToStyleDictionary = transformComponentsToStyleDictionary;
