import transformColors, { transformColorTypes } from './design/colors';
import transformEffects, { transformEffectTypes } from './design/effects';
import transformTypography, { transformTypographyTypes } from './design/typography';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component';
import { formatComponentCodeBlockComment } from '../utils';
/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssTypesTransformer(documentationObject, options) {
    var components = {};
    for (var componentName in documentationObject.components) {
        components[componentName] = transformComponentsToScssTypes(componentName, documentationObject.components[componentName], options === null || options === void 0 ? void 0 : options.get(componentName));
    }
    var design = {
        colors: transformColorTypes(documentationObject.design.color),
        effects: transformEffectTypes(documentationObject.design.effect),
        typography: transformTypographyTypes(documentationObject.design.typography),
    };
    return { components: components, design: design };
}
/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject, options) {
    var components = {};
    var _loop_1 = function (componentName) {
        components[componentName] = documentationObject.components[componentName]
            .map(function (component) { return ([
            formatComponentCodeBlockComment(componentName, component, '//'),
            Object.entries(transformComponentTokensToScssVariables(component, options === null || options === void 0 ? void 0 : options.get(componentName))).map(function (_a) {
                var variable = _a[0], value = _a[1];
                return "".concat(variable, ": ").concat(value.value, ";");
            }).join('\n')
        ].join('\n')); }).join('\n\n');
    };
    for (var componentName in documentationObject.components) {
        _loop_1(componentName);
    }
    var design = {
        colors: transformColors(documentationObject.design.color),
        typography: transformTypography(documentationObject.design.typography),
        effects: transformEffects(documentationObject.design.effect),
    };
    return { components: components, design: design };
}
