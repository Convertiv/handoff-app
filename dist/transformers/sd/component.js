import { transform } from '../transformer.js';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export var transformComponentsToStyleDictionary = function (_, component) {
    var sd = {};
    component.instances.forEach(function (instance) {
        var options = component.definitions[instance.definitionId].options;
        var tokens = transform('sd', instance, options);
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
