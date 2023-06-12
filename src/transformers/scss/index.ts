import { DocumentationObject } from '../../types';
import transformColors, { transformColorTypes } from './design/colors.js';
import transformEffects, { transformEffectTypes } from './design/effects.js';
import transformTypography, { transformTypographyTypes } from './design/typography.js';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component.js';
import { formatComponentCodeBlockComment } from '../utils.js';
import { ExportableTransformerOptionsMap } from '../types.js';

interface ScssTypesTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

interface ScssTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

/**
 * Build a set of Component types to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssTypesTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): ScssTypesTransformerOutput {
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
export default function scssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): ScssTransformerOutput {
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
