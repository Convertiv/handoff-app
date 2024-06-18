import { normalizeTokenNamePartValue } from '../utils';
import { transform } from '../transformer';
import { slugify } from '../../utils';
export var transformComponentsToScssTypes = function (name, component) {
    var result = {};
    component.instances.forEach(function (instance) {
        instance.variantProperties.forEach(function (_a) {
            var _b;
            var variantProp = _a[0], value = _a[1];
            if (value) {
                var options = component.definitions[instance.definitionId].options;
                (_b = result[variantProp]) !== null && _b !== void 0 ? _b : (result[variantProp] = new Set());
                result[variantProp].add(normalizeTokenNamePartValue(variantProp, value, options, true));
            }
        });
    });
    return (Object.keys(result)
        .map(function (variantProp) {
        var mapValsStr = Array.from(result[variantProp])
            .map(function (val) { return "\"".concat(val, "\""); })
            .join(', ');
        return "$".concat(name, "-").concat(slugify(variantProp), "-map: ( ").concat(mapValsStr, " );");
    })
        .join('\n\n') + '\n');
};
export var transformComponentTokensToScssVariables = function (component, options) {
    return transform('scss', component, options);
};
