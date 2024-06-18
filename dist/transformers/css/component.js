import { formatComponentCodeBlockComment } from '../utils.js';
import { transform } from '../transformer.js';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export var transformComponentsToCssVariables = function (componentId, component) {
    var _a, _b;
    var lines = [];
    var options = (_a = Object.values(component.definitions)[0]) === null || _a === void 0 ? void 0 : _a.options;
    var componentCssClass = (_b = options === null || options === void 0 ? void 0 : options.transformer.cssRootClass) !== null && _b !== void 0 ? _b : componentId;
    lines.push(".".concat(componentCssClass, " {"));
    var cssVars = component.instances.map(function (instance) {
        return "\t".concat(formatComponentCodeBlockComment(instance, '/**/'), "\n").concat(transformComponentTokensToCssVariables(instance, component.definitions[instance.definitionId].options)
            .map(function (token) { return "\t".concat(token.name, ": ").concat(token.value, ";"); })
            .join('\n'));
    });
    return lines.concat(cssVars).join('\n\n') + '\n}\n';
};
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export var transformComponentTokensToCssVariables = function (component, options) {
    return transform('css', component, options);
};
