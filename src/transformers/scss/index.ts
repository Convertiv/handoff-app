import { DocumentationObject } from '../../types';
import transformColors, { transformColorTypes } from './design/colors';
import transformEffects, { transformEffectTypes } from './design/effects';
import transformTypography, { transformTypographyTypes } from './design/typography';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component';
import { formatComponentCodeBlockComment } from '../utils';
import { TransformerOutput } from '../types';
import { IntegrationObject } from 'handoff/types/config';

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssTypesTransformer(documentationObject: DocumentationObject, integrationObject: IntegrationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToScssTypes(
      componentId,
      documentationObject.components[componentId],
      integrationObject.options[componentId]
    );
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
export default function scssTransformer(documentationObject: DocumentationObject, integrationObject: IntegrationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = documentationObject.components[componentId].instances
      .map((instance) => {
        return [
          formatComponentCodeBlockComment(instance, '//'),
          transformComponentTokensToScssVariables(instance, integrationObject.options[componentId])
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
  };

  return { components, design };
}
