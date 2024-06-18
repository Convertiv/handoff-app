import { DocumentationObject } from '../../types.js';
import transformColors, { transformColorTypes } from './design/colors.js';
import transformEffects, { transformEffectTypes } from './design/effects.js';
import transformTypography, { transformTypographyTypes } from './design/typography.js';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component.js';
import { formatComponentCodeBlockComment } from '../utils.js';
import { TransformerOutput } from '../types.js';

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssTypesTransformer(documentationObject: DocumentationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToScssTypes(componentId, documentationObject.components[componentId]);
  }

  const design = {
    colors: transformColorTypes(documentationObject.design.color),
    effects: transformEffectTypes(documentationObject.design.effect),
    typography: transformTypographyTypes(documentationObject.design.typography),
  };

  return { components, design };
}

/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    const definitions = documentationObject.components[componentId].definitions;
    components[componentId] = documentationObject.components[componentId].instances
      .map((instance) => {
        const options = definitions[instance.definitionId].options;
        return [
          formatComponentCodeBlockComment(instance, '//'),
          transformComponentTokensToScssVariables(instance, options)
            .map((token) => `${token.name}: ${token.value};`)
            .join('\n'),
        ].join('\n');
      })
      .join('\n\n');
  }

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  }

  return { components, design };
}
