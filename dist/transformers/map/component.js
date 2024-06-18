import { transform } from '../transformer.js';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export var transformComponentsToMap = function (_, component) {
    var map = {};
    component.instances.forEach(function (instance) {
        var options = component.definitions[instance.definitionId].options;
        var tokens = transform('map', instance, options);
        tokens.forEach(function (token) {
            map[token.name] = token.value;
        });
    });
    return map;
};
