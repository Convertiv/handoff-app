"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformComponentsToStyleDictionary = void 0;
const transformer_1 = require("../transformer");
const component_1 = require("../css/component");
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
const transformComponentsToStyleDictionary = (_, component, handoff, integrationOptions) => {
    const sd = {};
    component.instances.forEach((instance) => {
        const tokens = (0, transformer_1.transform)('sd', instance, integrationOptions);
        tokens.forEach((token) => {
            const tokenNameSegments = token.metadata.nameSegments;
            const lastIdx = tokenNameSegments.length - 1;
            let ref = sd;
            tokenNameSegments.forEach((tokenNameSegment, idx) => {
                var _a;
                if (idx === lastIdx) {
                    return;
                }
                (_a = ref[tokenNameSegment]) !== null && _a !== void 0 ? _a : (ref[tokenNameSegment] = {});
                ref = ref[tokenNameSegment];
            });
            const propParts = tokenNameSegments[lastIdx].split('-');
            propParts.forEach((el) => {
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
