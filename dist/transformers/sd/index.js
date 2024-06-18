import { transformComponentsToStyleDictionary } from './component.js';
import transformColors from './design/colors.js';
import transformEffects from './design/effects.js';
import transformTypography from './design/typography.js';
export default function sdTransformer(documentationObject) {
    var components = {};
    for (var componentId in documentationObject.components) {
        components[componentId] = transformComponentsToStyleDictionary(componentId, documentationObject.components[componentId]);
    }
    var design = {
        colors: transformColors(documentationObject.design.color),
        typography: transformTypography(documentationObject.design.typography),
        effects: transformEffects(documentationObject.design.effect),
    };
    return {
        components: components,
        design: design,
    };
}
