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
export function scssTypesTransformer(documentationObject) {
    var components = {};
    for (var componentId in documentationObject.components) {
        components[componentId] = transformComponentsToScssTypes(componentId, documentationObject.components[componentId]);
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
export default function scssTransformer(documentationObject) {
    var components = {};
    var _loop_1 = function (componentId) {
        var definitions = documentationObject.components[componentId].definitions;
        components[componentId] = documentationObject.components[componentId].instances
            .map(function (instance) {
            var options = definitions[instance.definitionId].options;
            return [
                formatComponentCodeBlockComment(instance, '//'),
                transformComponentTokensToScssVariables(instance, options)
                    .map(function (token) { return "".concat(token.name, ": ").concat(token.value, ";"); })
                    .join('\n'),
            ].join('\n');
        })
            .join('\n\n');
    };
    for (var componentId in documentationObject.components) {
        _loop_1(componentId);
    }
    var design = {
        colors: transformColors(documentationObject.design.color),
        typography: transformTypography(documentationObject.design.typography),
        effects: transformEffects(documentationObject.design.effect),
    };
    return { components: components, design: design };
}
