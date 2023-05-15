import { DocumentationObject } from '../../types';
import transformColors, { transformColorTypes } from './design/colors';
import transformEffects, { transformEffectTypes } from './design/effects';
import transformTypography, { transformTypographyTypes } from './design/typography';
import { transformComponentTokensToScssVariables, transformComponentsToScssTypes } from './component';
import { componentCodeBlockComment } from '../utils';

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
export function scssTypesTransformer(documentationObject: DocumentationObject): ScssTypesTransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToScssTypes(componentName, documentationObject.components[componentName])
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
export default function scssTransformer(documentationObject: DocumentationObject): ScssTransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = documentationObject.components[componentName]
      .map((component) => ([
        componentCodeBlockComment(componentName, component, '//'),
        Object.entries(transformComponentTokensToScssVariables(component)).map(([variable, value]) => `${variable}: ${value.value};`).join('\n')
      ].join('\n'))).join('\n\n');
  }

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  }

  return { components, design };
}
