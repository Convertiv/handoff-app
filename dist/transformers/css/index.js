import { transformComponentsToCssVariables } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';
export default function cssTransformer(documentationObject, options) {
    var components = {};
    for (var componentName in documentationObject.components) {
        components[componentName] = transformComponentsToCssVariables(componentName, documentationObject.components[componentName], options === null || options === void 0 ? void 0 : options.get(componentName));
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
