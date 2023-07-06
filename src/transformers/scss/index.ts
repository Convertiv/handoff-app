import { DocumentationObject } from '../../types';
import transformColors, { transformColorTypes } from './design/colors';
import transformEffects, { transformEffectTypes } from './design/effects';
import transformTypography, { transformTypographyTypes } from './design/typography';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component';
import { formatComponentCodeBlockComment } from '../utils';
import { ExportableTransformerOptionsMap, TransformerOutput } from '../types';

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssTypesTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToScssTypes(componentName, documentationObject.components[componentName], options?.get(componentName));
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
export default function scssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = documentationObject.components[componentName]
      .map((component) => ([
        formatComponentCodeBlockComment(componentName, component, '//'),
        Object.entries(transformComponentTokensToScssVariables(component, options?.get(componentName))).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')
      ].join('\n'))).join('\n\n');
  }

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  }

  return { components, design };
}
